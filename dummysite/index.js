import {
  AppsV1Api,
  CoreV1Api,
  CustomObjectsApi,
  KubeConfig,
  NetworkingV1Api,
  makeInformer,
} from '@kubernetes/client-node'

const GROUP = 'stable.dwk'
const VERSION = 'v1'
const PLURAL = 'dummysites'

const kc = new KubeConfig()
kc.loadFromDefault()

const appsApi = kc.makeApiClient(AppsV1Api)
const coreApi = kc.makeApiClient(CoreV1Api)
const networkingApi = kc.makeApiClient(NetworkingV1Api)
const customApi = kc.makeApiClient(CustomObjectsApi)

const ownerReference = (site) => ({
  apiVersion: `${GROUP}/${VERSION}`,
  kind: 'DummySite',
  name: site.metadata.name,
  uid: site.metadata.uid,
  controller: true,
  blockOwnerDeletion: true,
})

const deploymentOf = (site) => ({
  metadata: {
    name: `${site.metadata.name}-dep`,
    labels: { app: site.metadata.name },
    ownerReferences: [ownerReference(site)],
  },
  spec: {
    replicas: 1,
    selector: { matchLabels: { app: site.metadata.name } },
    template: {
      metadata: { labels: { app: site.metadata.name } },
      spec: {
        volumes: [{ name: 'site', emptyDir: {} }],
        initContainers: [
          {
            name: 'fetch-site',
            image: 'curlimages/curl:8.11.1',
            command: [
              'curl',
              '--location',
              '--output',
              '/usr/share/nginx/html/index.html',
              site.spec.website_url,
            ],
            volumeMounts: [{ name: 'site', mountPath: '/usr/share/nginx/html' }],
          },
        ],
        containers: [
          {
            name: 'nginx',
            image: 'nginx:1.27-alpine',
            ports: [{ containerPort: 80 }],
            volumeMounts: [{ name: 'site', mountPath: '/usr/share/nginx/html' }],
          },
        ],
      },
    },
  },
})

const serviceOf = (site) => ({
  metadata: {
    name: `${site.metadata.name}-svc`,
    ownerReferences: [ownerReference(site)],
  },
  spec: {
    type: 'ClusterIP',
    selector: { app: site.metadata.name },
    ports: [{ port: 80, protocol: 'TCP', targetPort: 80 }],
  },
})

const ingressOf = (site) => ({
  metadata: {
    name: `${site.metadata.name}-ingress`,
    ownerReferences: [ownerReference(site)],
  },
  spec: {
    rules: [
      {
        host: `${site.metadata.name}.localhost`,
        http: {
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: { name: `${site.metadata.name}-svc`, port: { number: 80 } },
              },
            },
          ],
        },
      },
    ],
  },
})

const alreadyExists = (error) => error.code === 409 || error.statusCode === 409

const create = async (kind, creator) => {
  try {
    await creator()
    console.log(`Created ${kind}`)
  } catch (error) {
    if (alreadyExists(error)) {
      console.log(`${kind} already exists`)
      return
    }
    throw error
  }
}

const createResources = async (site) => {
  const namespace = site.metadata.namespace
  console.log(`Creating the resources of ${site.metadata.name} in ${namespace}`)

  await create('deployment', () =>
    appsApi.createNamespacedDeployment({ namespace, body: deploymentOf(site) })
  )
  await create('service', () =>
    coreApi.createNamespacedService({ namespace, body: serviceOf(site) })
  )
  await create('ingress', () =>
    networkingApi.createNamespacedIngress({ namespace, body: ingressOf(site) })
  )
}

const informer = makeInformer(kc, `/apis/${GROUP}/${VERSION}/${PLURAL}`, () =>
  customApi.listClusterCustomObject({ group: GROUP, version: VERSION, plural: PLURAL })
)

informer.on('add', (site) => {
  createResources(site).catch((error) => console.error('Could not create the resources', error))
})

informer.on('error', (error) => {
  console.error('Watch error, restarting in 5 seconds', error)
  setTimeout(() => informer.start(), 5000)
})

await informer.start()
console.log('Watching DummySite resources')
