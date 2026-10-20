from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def create_attack_graph(report_id: int, analysis: dict):
    threat_actor = analysis.get("threat_actor", "Unknown")
    cves = analysis.get("cves", [])
    iocs = analysis.get("iocs", {})
    recommendations = analysis.get("recommendations", [])
    severity = analysis.get("severity", "Unknown")

    with driver.session() as session:
        session.run("MATCH (n {report_id: $rid}) DETACH DELETE n", rid=report_id)

        session.run("""
            MERGE (a:ThreatActor {name: $name, report_id: $rid})
            SET a.severity = $severity
        """, name=threat_actor, rid=report_id, severity=severity)

        for cve in cves:
            session.run("""
                MERGE (c:CVE {name: $cve, report_id: $rid})
                WITH c
                MATCH (a:ThreatActor {name: $actor, report_id: $rid})
                MERGE (a)-[:EXPLOITS]->(c)
            """, cve=cve, rid=report_id, actor=threat_actor)

        domains = iocs.get("domains", [])
        ips = iocs.get("ip_addresses", [])

        for domain in domains:
            session.run("""
                MERGE (d:IOC {name: $name, type: 'domain', report_id: $rid})
                WITH d
                MATCH (a:ThreatActor {name: $actor, report_id: $rid})
                MERGE (a)-[:USES]->(d)
            """, name=domain, rid=report_id, actor=threat_actor)

        for ip in ips:
            session.run("""
                MERGE (i:IOC {name: $name, type: 'ip', report_id: $rid})
                WITH i
                MATCH (a:ThreatActor {name: $actor, report_id: $rid})
                MERGE (a)-[:USES]->(i)
            """, name=ip, rid=report_id, actor=threat_actor)

        for rec in recommendations[:3]:
            session.run("""
                MERGE (r:Mitigation {name: $name, report_id: $rid})
                WITH r
                MATCH (a:ThreatActor {name: $actor, report_id: $rid})
                MERGE (a)-[:MITIGATED_BY]->(r)
            """, name=rec[:60], rid=report_id, actor=threat_actor)

def get_attack_graph(report_id: int) -> dict:
    with driver.session() as session:
        result = session.run("""
            MATCH (n {report_id: $rid})
            OPTIONAL MATCH (n)-[r]->(m {report_id: $rid})
            RETURN
                elementId(n) AS source_id,
                n.name AS source_name,
                labels(n) AS source_labels,
                type(r) AS relationship,
                elementId(m) AS target_id,
                m.name AS target_name,
                labels(m) AS target_labels
        """, rid=report_id)

        nodes = {}
        links = []

        for record in result:
            source_id = record["source_id"]
            nodes[source_id] = {
                "id": source_id,
                "name": record["source_name"] or "",
                "type": record["source_labels"][0]
                if record["source_labels"] else "Unknown"
            }

            target_id = record["target_id"]
            relationship = record["relationship"]

            if target_id is not None and relationship is not None:
                nodes[target_id] = {
                    "id": target_id,
                    "name": record["target_name"] or "",
                    "type": record["target_labels"][0]
                    if record["target_labels"] else "Unknown"
                }
                links.append({
                    "source": source_id,
                    "target": target_id,
                    "type": relationship
                })

        return {"nodes": list(nodes.values()), "links": links}
