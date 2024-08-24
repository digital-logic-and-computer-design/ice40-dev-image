IMAGE := bsiever/ice40-dev
TAG?=test	

.PHONY: default
default: run

build:
	docker build --build-arg VCS_REF=$(shell git rev-parse HEAD) --tag $(IMAGE):$(TAG) .

depends:
	brew install docker-squash
#	pip3 install docker-squash

rebuild:
	docker build --build-arg VCS_REF=$(shell git rev-parse HEAD) --no-cache --tag $(IMAGE) .

run:
	docker run --env LANG=$(LANG) --env LOCAL_WORKSPACE_FOLDER="$(PWD)" --interactive --publish-all --rm --security-opt seccomp=unconfined --tty --volume "$(PWD)":/mnt --volume /var/run/docker.sock:/var/run/docker-host.sock --workdir /mnt $(IMAGE) bash --login || true

squash: depends
	docker-squash --tag $(IMAGE) $(IMAGE)

# Push the image.  If there's a command line argument, use that as the tag
push:
	docker push $(IMAGE):$(TAG)