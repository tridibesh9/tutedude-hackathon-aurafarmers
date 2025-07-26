from cassandra.cluster import Cluster, Session, ExecutionProfile, EXEC_PROFILE_DEFAULT
from cassandra.query import SimpleStatement, dict_factory
from cassandra.auth import PlainTextAuthProvider
from cassandra.policies import DCAwareRoundRobinPolicy, TokenAwarePolicy, ExponentialReconnectionPolicy
from fastapi import HTTPException, status
from typing import Optional

from app.core.config import settings

scylla_cluster: Optional[Cluster] = None
scylla_session_global: Optional[Session] = None

def connect_to_scylla():
    global scylla_cluster, scylla_session_global
    if scylla_session_global:
        return

    auth_provider = None
    if settings.SCYLLA_USER and settings.SCYLLA_PASSWORD:
        auth_provider = PlainTextAuthProvider(username=settings.SCYLLA_USER, password=settings.SCYLLA_PASSWORD)

    # load_balancing_policy = TokenAwarePolicy(DCAwareRoundRobinPolicy(local_dc=settings.SCYLLA_LOCAL_DC)) if settings.SCYLLA_LOCAL_DC else TokenAwarePolicy(DCAwareRoundRobinPolicy())
    load_balancing_policy = TokenAwarePolicy(DCAwareRoundRobinPolicy())


    scylla_cluster = Cluster(
        settings.SCYLLA_HOSTS,
        port=settings.SCYLLA_PORT,
        auth_provider=auth_provider,
        load_balancing_policy=load_balancing_policy,
        reconnection_policy=ExponentialReconnectionPolicy(base_delay=1.0, max_delay=60.0)
    )
    try:
        scylla_session_global = scylla_cluster.connect()
        scylla_session_global.row_factory = dict_factory
        scylla_session_global.execute(f"""
            CREATE KEYSPACE IF NOT EXISTS {settings.SCYLLA_KEYSPACE}
            WITH REPLICATION = {{ 'class' : 'SimpleStrategy', 'replication_factor' : 1 }};
        """)
        scylla_session_global.set_keyspace(settings.SCYLLA_KEYSPACE)
        print(f"Successfully connected to ScyllaDB and set keyspace to '{settings.SCYLLA_KEYSPACE}'.")
        # create_scylla_tables_if_not_exist()
    except Exception as e:
        print(f"Could not connect to ScyllaDB: {e}")
        scylla_cluster = None
        scylla_session_global = None
        # Depending on policy, might want to raise an error or allow app to start and fail on requests

def close_scylla_connection():
    global scylla_cluster, scylla_session_global
    if scylla_cluster:
        print("Closing ScyllaDB connection.")
        scylla_cluster.shutdown()
        scylla_cluster = None
        scylla_session_global = None

