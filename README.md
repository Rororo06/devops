# Kubernetes Submissions

DevOps with Kubernetes 2026 exercise submissions.

- `log_output/` - Log output application (exercises 1.1, 1.3)
- `todo-app/` - Course project (exercises 1.2, 1.4)

## Usage

```
docker build -t log-output:1.0 log_output
k3d image import log-output:1.0
kubectl apply -f log_output/manifests/deployment.yaml
kubectl logs -f deployment/log-output-dep
```

## 3.9 DBaaS vs DIY

Comparison for the todo project database: Google Cloud SQL (DBaaS) vs the
self-hosted PostgreSQL StatefulSet + PersistentVolumeClaim used in this repo.

### Work and cost to initialize

| | Cloud SQL (DBaaS) | Self-hosted (StatefulSet + PVC) |
| --- | --- | --- |
| Setup work | One `gcloud sql instances create` + user/db creation, then wire the connection string into a Secret. No manifests to design. | StatefulSet, headless Service, PVC, Secret and volume layout have to be written and tuned by us (already done in `manifests/`). |
| Time to first working DB | Minutes, but instance creation itself is slow (~10 min) | Minutes, pod starts in seconds |
| Initial cost | Billed per instance-hour + storage even when idle; the smallest usable instance is clearly more expensive than a pod | Only the cost of the node CPU/RAM we already pay for, plus the PersistentDisk backing the PVC |
| Networking | Needs private IP / Cloud SQL Auth Proxy / Workload Identity to connect from GKE | Plain in-cluster DNS (`postgres-svc`), nothing extra |

### Maintenance

- **Cloud SQL**: minor version patching, OS patching, failover and storage
  autogrowth are Google's responsibility. Maintenance windows are configurable.
  High availability is a checkbox (regional instance), read replicas and
  vertical scaling are one command and mostly online.
- **Self-hosted**: we own everything — Postgres upgrades (which for a
  StatefulSet means a careful, potentially breaking data-directory migration),
  monitoring, disk resizing, and any HA setup (replication, failover
  controller, or an operator such as CloudNativePG). Node upgrades and cluster
  autoscaler evictions can move the pod; without a PodDisruptionBudget this
  causes downtime.

### Backups

- **Cloud SQL**: automated daily backups + point-in-time recovery via WAL
  archiving are built in and enabled with a flag. Restore is a single command
  or console click, and restoring to a specific timestamp is possible.
  Backups are retained and managed by the platform, off the cluster.
- **Self-hosted**: we implemented it ourselves — `manifests/backup-cronjob.yaml`
  runs `pg_dump` every 24 h and uploads the dump to Google Cloud Storage using
  Workload Identity. This gives a daily snapshot only: everything written since
  the last dump is lost on a restore, and there is no PITR unless we also build
  WAL shipping. Restoring means creating the database and piping the dump back
  in with `psql` — simple, but manual and untested unless we test it ourselves.

### Pros / cons summary

**Cloud SQL pros**: almost no operational work, backups/PITR/HA out of the box,
predictable upgrades, good integration with Cloud Monitoring.
**Cloud SQL cons**: noticeably higher running cost, vendor lock-in, less control
over configuration and extensions, connectivity from the cluster needs extra
components.

**Self-hosted pros**: cheap (reuses cluster resources), fully portable between
k3d/GKE/any cluster, full control of version, config and extensions, the whole
setup lives in Git next to the app.
**Self-hosted cons**: every failure, upgrade and backup is our problem; the
backup story we built is weaker (daily dumps, no PITR, restore path is manual);
HA requires significant extra work.

**Choice for this project**: the self-hosted StatefulSet is the right trade-off
for a course project — the data is not critical, cost matters, and the daily
`pg_dump` to Cloud Storage is enough. For production data I would take Cloud SQL,
because managed PITR and failover are far cheaper to buy than to build.

## 3.10 Database backup

`manifests/backup-cronjob.yaml` runs daily at 03:00: an init container
(`postgres:18.0`) writes `pg_dump` output to an `emptyDir`, and the main
container (`google/cloud-sdk`) uploads it to
`gs://dwk-todo-backups-<project>/todo-<timestamp>.sql`.

No service-account key is stored anywhere: the pod uses a Kubernetes
ServiceAccount (`backup-sa`) bound to the Google service account
`my-storage-sa` via GKE Workload Identity.

```
gcloud container clusters update dwk-cluster --zone=europe-north1-b \
  --workload-pool=PROJECT_ID.svc.id.goog
gcloud container node-pools update default-pool --cluster=dwk-cluster \
  --zone=europe-north1-b --workload-metadata=GKE_METADATA
gcloud iam service-accounts add-iam-policy-binding \
  my-storage-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:PROJECT_ID.svc.id.goog[project/backup-sa]"
```

## 3.11 Resource requests and limits

Requests/limits are set for todo-app, todo-backend, the Postgres StatefulSet and
the backup CronJob containers, sized from `kubectl top pods` on GKE (app pods
use ~7-10 Mi and ~1m CPU idle, Postgres ~41 Mi).

## 3.12 GKE logs

`gke-logs-todo-created.png` shows the Cloud Logging entry of the todo-backend
pod when a new todo is created.
