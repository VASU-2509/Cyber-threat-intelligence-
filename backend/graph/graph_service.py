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
            RETURN n, r, m
        """, rid=report_id)

        nodes = {}
        links = []

        for record in result:
            n = record["n"]
            m = record["m"]
            r = record["r"]

            n_id = str(n.element_id)
            n_labels = list(n.labels)
            nodes[n_id] = {
                "id": n_id,
                "name": n.get("name", ""),
                "type": n_labels[0] if n_labels else "Unknown"
            }

            if m and r:
                m_id = str(m.element_id)
                m_labels = list(m.labels)
                nodes[m_id] = {
                    "id": m_id,
                    "name": m.get("name", ""),
                    "type": m_labels[0] if m_labels else "Unknown"
                }
                links.append({
                    "source": n_id,
                    "target": m_id,
                    "type": r.type
                })

        return {"nodes": list(nodes.values()), "links": links}