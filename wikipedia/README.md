# Wikipedia (exercise 5.4)

nginx serves whatever is in `/usr/share/nginx/html`, which is an `emptyDir`
shared by all containers of the pod.

- the init container `wikipedia-fetcher` curls
  <https://en.wikipedia.org/wiki/Kubernetes> into the shared directory before
  nginx starts
- the sidecar `wikipedia-randomizer` (an init container with
  `restartPolicy: Always`) sleeps a random 5-15 minutes and then replaces the
  page with <https://en.wikipedia.org/wiki/Special:Random>

## Deploying

```bash
kubectl apply -k wikipedia
```

## Verifying

```bash
$ kubectl -n exercises exec deploy/wikipedia-dep -c wikipedia -- wget -qO- http://localhost/ | grep -m1 "<title>"
<title>Kubernetes - Wikipedia</title>
```

After the sidecar has done a round (the same curl run by hand here so the test
does not take 15 minutes) the served page is a random one:

```bash
$ kubectl -n exercises exec deploy/wikipedia-dep -c wikipedia -- wget -qO- http://localhost/ | grep -m1 "<title>"
<title>Nicolette Fay Sheridan - Wikipedia</title>
```
