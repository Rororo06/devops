# Greeter (exercise 5.3)

The greeter answers HTTP GET requests with a greeting. Two versions are deployed
and the traffic between them is split 75/25 with a `HTTPRoute` that is attached
to `greeter-svc`. The log output application reads the greeting from
`greeter-svc.exercises.svc.cluster.local:3001` and prints it as a part of its
output.

## Deploying

```bash
kubectl label namespace exercises istio.io/dataplane-mode=ambient --overwrite
docker build -t greeter:1.0 greeter
docker build -t log-output-reader:1.5 log_output/reader
k3d image import greeter:1.0 log-output-reader:1.5 -c k3s-default
kubectl apply -k greeter
kubectl apply -k log_output
```

The waypoint proxy is created by `manifests/waypoint.yaml` and the greeter
services opt into it with the label `istio.io/use-waypoint: waypoint`, which is
what makes the L7 traffic split possible.

## Verifying

```bash
$ kubectl -n exercises exec deploy/log-output-dep -c log-output-reader -- wget -qO- http://localhost:3000
greeting: hello from greeter v1
file content: this text is from file
env variable: MESSAGE=hello gitops
2026-08-29T23:34:50.785Z: 0a1c598f-85e7-4d87-a779-5cf3e4853e58.
Ping / Pongs: 0
```

100 requests through `greeter-svc` were distributed as the `HTTPRoute` defines:

```text
v1=73 v2=27
```
