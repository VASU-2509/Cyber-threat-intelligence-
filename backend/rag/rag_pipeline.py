from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv

load_dotenv()

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "threat_reports"

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

def ensure_collection():
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
        )

def index_report(report_id: int, text: str):
    ensure_collection()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(text)
    docs = [
        Document(page_content=chunk, metadata={"report_id": report_id})
        for chunk in chunks
    ]
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings
    )
    vectorstore.add_documents(docs)

def query_reports(question: str, report_id: int = None) -> str:
    ensure_collection()
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    prompt = PromptTemplate.from_template("""
You are a cybersecurity analyst. Answer the question based only on the context below.
If the answer is not in the context, say "I couldn't find that in the uploaded reports."

Context: {context}

Question: {question}

Answer:""")

    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain.invoke(question)