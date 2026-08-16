# Service Registry

The Service Registry is the authoritative catalog of runtime capabilities.

## Registered Data
Each service descriptor includes:
- service id
- public token or interface name
- implementation version
- lifecycle
- capabilities
- owning module
- visibility: public, internal, or extension
- factory or instance provider
- compatibility range

## Resolution
Consumers resolve services through the dependency container, not by importing implementations. Resolution supports lazy loading, named services, version compatibility checks, factories, and future hot swapping.

## Visibility
Public services can be consumed across modules. Internal services remain module-private. Extension services are exposed only to approved plugins.
