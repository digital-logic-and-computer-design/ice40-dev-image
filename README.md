# Building

Be sure Docker Desktop is running, up-to-date, and that you're logged in.

## TAG

Use `TAG=tagname`, like `TAG=v1` on `make` command line

# General 

* `make build`: Build image 
* `make rebuild`: Force full rebuild without using cached work

# Deploying to Dockerhub

* `make push TAG=tag` to push a tag
* `make make-latest TAG=tag` to make/push a specific image as the tagged "latest" used in the devcontainer.

### Example

```
make make-latest TAG=v1
```