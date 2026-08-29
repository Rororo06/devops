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
