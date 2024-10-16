# Building

Be sure Docker Desktop is running, up-to-date, and that you're logged in.

## TAG

Use `TAG=tag`, like `TAG=v1` on `make` command line

# General 

* `make build TAG=tag`: Build image 
* `make rebuild TAG=tag`: Force full rebuild without using cached work

# Deploying to Dockerhub

* `make push TAG=tag` to push a tag
* `make make-latest TAG=tag` to make/push a specific image as the tagged "latest" used in the devcontainer.

### Example

```
make build TAG=v1
make push TAG=v1
make make-latest TAG=v1
```