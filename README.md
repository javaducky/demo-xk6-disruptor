# Demo for Fault Injection with k6 using xk6-disruptor
Project for demonstrating fault injection with k6 and xk6-disruptor on the OpenTelemetry Demo in Kubernetes.

The scenario is that we have our _system under test (SUT)_ provided by the most excellent [OpenTelemetry Astronomy Shop](https://github.com/open-telemetry/opentelemetry-demo). 
The entire system will be running within a single Kubernetes cluster on which we can inject failures to test reliability.

## Prerequisites
We'll be making use of these tools during the course of this demonstration.

* [git](https://git-scm.com/) - For accessing the sourcecode repositories.
* [go](https://go.dev/doc/install) - To install `xk6` and build a custom `k6` binary.
* [Docker](https://docs.docker.com/get-docker/) - For running the examples and other tooling.
* [k3d](https://k3d.io/) - Wrapper to run a [k3s](https://k3s.io/) Kubernetes cluster in Docker.
* [kubectl](https://kubernetes.io/releases/download/#kubectl) - Client for talking to Kubernetes clusters.
* [helm](https://helm.sh/) - Client for deploying software packages into Kubernetes.

There _may_ be others that I didn't recall as having them installed long ago. My apologies for any issues!

## Build our extended k6
k6 is flexible tool allowing for custom capabilities via an extension system using [xk6](https://github.com/grafana/xk6).
Using `xk6` and extensions, you build a new `k6` binary incorporating the desired functionality.
[xk6-disruptor](https://github.com/grafana/xk6-disruptor) is one of those extensions which are not included in 
the core k6 product by default.

> :bookmark: Refer to the [xk6 guides](https://k6.io/docs/extensions/guides/build-a-k6-binary-using-go/) for the latest 
> information if you run into problems building.

First, ensure `xk6` is installed into your Go toolchain:

```shell
go install go.k6.io/xk6/cmd/xk6@latest
```

Next we'll use `xk6` to build a new `k6` binary with the disruptor source code pulled directly from _GitHub_:

```shell
xk6 build latest \
  --with github.com/grafana/xk6-disruptor
```

> :point_right: If you'd like additional extensions to try out, take a look at the [Bundle section](https://k6.io/docs/extensions/get-started/bundle/)
> of the k6 documentation to review extensions and build your command line. Make sure `xk6-disruptor` is selected!

Once the `xk6` command finishes building, verify your custom build by checking the version.

```shell
./k6 version
```

You should see output similar to the following:

```
$ ./k6 version
k6 v0.46.0 ((devel), go1.21.1, darwin/arm64)
Extensions:
  github.com/grafana/xk6-disruptor v0.3.9, k6/x/disruptor [js]
```

> :warning: Make sure you use the newly built `k6` from your current directory! It's possible that you also have another 
> version of `k6` on your system path.


## Create a local Kubernetes cluster
We'll use [k3d](https://k3d.io/) to run a local _Kubernetes_ cluster within _Docker_. Once installed, use
the following command to create a three-node cluster named `k6-demo-cluster`.

```shell
k3d cluster create k6-demo-cluster \
 --api-port 6550 \
 -p "8081:80@loadbalancer" \
 --agents 3
```

> :point_right: If you've previously created the cluster, you can start the cluster using `k3d cluster start k6-demo-cluster`
> if not already running.

Once this is complete, you'll now have a running Kubernetes cluster on which you can use `kubectl` as well as other tooling
like [k9s](https://k9scli.io/). 

```
$ kubectl get nodes
NAME                             STATUS   ROLES                  AGE   VERSION
k3d-k6-demo-cluster-agent-1      Ready    <none>                 15s   v1.27.4+k3s1
k3d-k6-demo-cluster-server-0     Ready    control-plane,master   18s   v1.27.4+k3s1
k3d-k6-demo-cluster-agent-2      Ready    <none>                 14s   v1.27.4+k3s1
k3d-k6-demo-cluster-agent-0      Ready    <none>                 14s   v1.27.4+k3s1
```


## Deploy the OpenTelemetry Astronomy Shop
The _Astronomy Shop_ provides a realistic microservices environment comprised of multiple services, written in various 
languages, communicating using various protocols including gRPC, Kafka messaging, and HTTP. 

The recommended approach for installing the demo application is using a _Helmchart_.

> :bookmark: Refer to the [Kubernetes installation](https://opentelemetry.io/docs/demo/kubernetes-deployment/)
> for the latest information if you run into problems deploying.

If not previously done, you'll need to configure your Helm client to look for deployment packages, i.e. _Helmcharts_,
within the OpenTelemetry chart repository. This should only need to be done once.

```shell
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
```

Next, we'll create an isolated namespace within our Kubernetes cluster, then install the `open-telemetry/opentelemetry-demo` 
chart into it as `otel-demo`.

```shell
kubectl create ns otel-demo
helm install otel-demo open-telemetry/opentelemetry-demo -n otel-demo
```

Here is an example of the output to expect.

```
$ helm install otel-demo open-telemetry/opentelemetry-demo -n otel-demo
NAME: otel-demo
LAST DEPLOYED: Tue Sep 19 16:26:07 2023
NAMESPACE: otel-demo
STATUS: deployed
REVISION: 1
NOTES:
=======================================================================================


 ██████╗ ████████╗███████╗██╗         ██████╗ ███████╗███╗   ███╗ ██████╗
██╔═══██╗╚══██╔══╝██╔════╝██║         ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
██║   ██║   ██║   █████╗  ██║         ██║  ██║█████╗  ██╔████╔██║██║   ██║
██║   ██║   ██║   ██╔══╝  ██║         ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
╚██████╔╝   ██║   ███████╗███████╗    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
 ╚═════╝    ╚═╝   ╚══════╝╚══════╝    ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝


- All services are available via the Frontend proxy: http://localhost:8080
  by running these commands:
     kubectl port-forward svc/otel-demo-frontendproxy 8080:8080

  The following services are available at these paths once the proxy is exposed:
  Webstore             http://localhost:8080/
  Grafana              http://localhost:8080/grafana/
  Feature Flags UI     http://localhost:8080/feature/
  Load Generator UI    http://localhost:8080/loadgen/
  Jaeger UI            http://localhost:8080/jaeger/ui/

- OpenTelemetry Collector OTLP/HTTP receiver (required for browser spans to be emitted):
  by running these commands:
     kubectl port-forward svc/otel-demo-otelcol 4318:4318

```

As noted in the above output from the installation, we'll add some port-forwarding to enable access to the services
from _outside_ the Kubernetes cluster, i.e. from our desktop. 

> :point_right: This can also be accomplished by creating a Port-Forward on the services from within k9s.

```shell
# Enable access to the UI elements from the host machine browser.
kubectl port-forward -n otel-demo svc/otel-demo-frontendproxy 8080:8080
```

With the forwarding enabled, the following links should now be accessible:
- [Web Storefront](http://localhost:8080/)
- [Grafana Dashboards](http://localhost:8080/grafana/)
- [Feature Flags UI](http://localhost:8080/feature/)
- [Load Generator UI](http://localhost:8080/loadgen/)
- [Jaeger UI](http://localhost:8080/jaeger/ui/)

```shell
# Enable publishing Open Telemetry metrics and traces from our k6 tests.
kubectl port-forward -n otel-demo svc/otel-demo-otelcol 4318:4318
```

## Scenario 0 - Viewing base activity
By default, Locust is running generating some activity against our site. 
Open Grafana, looking at activity for the [Recommendation Service](http://localhost:8080/grafana/d/W2gX2zHVk/demo-dashboard?orgId=1&var-service=recommendationservice&refresh=5s&from=now-5m&to=now).

## Scenario 1 - Create increased load in activity
Using k6, let's create some increased load for the service.

```shell
./k6 run tests/01-recommendation-spike.js --duration 30s --vus 20
```

## Scenario 2 - Cause a little chaos with ServiceDisruptor
Using the objects from xk6-disruptor, we'll inject service disruptions to the recommendation service.

```shell
./k6 run tests/02-recommendation-service-disruption.js --duration 30s --vus 20
```
