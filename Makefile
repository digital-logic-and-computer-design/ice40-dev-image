IMAGE := bsiever/ice40-dev
TAG?=test	

.PHONY: default
default: run

# Enable multi-platform builds in Docker. See: https://docs.docker.com/desktop/containerd/ 
updateExtensions:
	(cd opt; ./updateExtensions.sh)

build: updateExtensions
	docker buildx build --platform linux/amd64,linux/arm64 --build-arg VCS_REF=$(shell git rev-parse HEAD) --tag $(IMAGE):$(TAG) .

rebuild:
	docker buildx --platform linux/amd64,linux/arm64 --build-arg VCS_REF=$(shell git rev-parse HEAD) --no-cache --tag $(IMAGE):$(TAG) .

run:
	docker run --env LANG=$(LANG) --env LOCAL_WORKSPACE_FOLDER="$(PWD)" -p 3000:3000 --interactive --publish-all --rm --security-opt seccomp=unconfined --tty --volume "$(PWD)":/mnt --volume /var/run/docker.sock:/var/run/docker-host.sock --workdir /mnt $(IMAGE):$(TAG) bash --login || true

# depends:
# 	brew install docker-squash
# #	pip3 install docker-squash
# squash: depends
# 	docker-squash --tag $(IMAGE) $(IMAGE)

# Push the image.  If there's a command line argument, use that as the tag
push:
	docker push $(IMAGE):$(TAG)

make-latest:
	docker tag $(IMAGE):$(TAG) $(IMAGE):latest
	docker push $(IMAGE):latest	

	