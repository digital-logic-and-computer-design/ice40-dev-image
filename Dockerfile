# Based on cs50/cli https://github.com/cs50/cli/

# Build stage
FROM ubuntu:24.04

# Build-time variables
ARG DEBIAN_FRONTEND=noninteractive
ARG BUILDARCH

# Stage-wide dependencies
RUN apt update && \
    apt install --no-install-recommends --no-install-suggests --yes \
        build-essential 

RUN apt-get -y install \
        ca-certificates \
        curl \ 
        wget

#### FPGA programmer / server support: 
# Install Node.js, npm, and express
RUN apt-get -y install \
    nodejs \
    npm 
RUN npm install --global \
    express

### General development tools
RUN apt-get -y install \
    git \
    universal-ctags 

### Python development tools
RUN apt-get -y install \
    python3-pip \
    pipx

# Generic verilog support tools
RUN apt-get -y install \
    iverilog \
    verilator \
    yosys 

# TODO / Consider
## Consider using a newer version of yosys and the system verilog 
## https://github.com/chipsalliance/synlig 

# ice40 specific tools
RUN apt-get -y install \
    fpga-icestorm \
    nextpnr-ice40

# RISC-V tools
RUN apt-get -y install \
    gcc-riscv64-unknown-elf 

# Avoid "delaying package configuration, since apt-utils is not installed"
# Install locales
RUN apt update && \
    apt install --no-install-recommends --no-install-suggests --yes \
        apt-utils \
        locales && \
    locale-gen \
        en_US.utf8 \
        zh_CN.utf8 \
        zh_TW.utf8 \
        fr_FR.utf8 \
        de_DE.utf8 \
        it_IT.utf8 \
        es_ES.utf8 \
        ja_JP.utf8 \
        ko_KR.utf8 \
        ru_RU.utf8 \
        pt_BR.utf8 \
        tr_TR.utf8 \
        pl_PL.utf8 \
        cs_CZ.utf8 \
        hu_HU.utf8 \
        bg_BG.UTF-8
ENV LANG=C.UTF-8

# Verible https://igorfreire.com.br/tag/verible/
# ARG TARGETPLATFORM
# RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then ARCHITECTURE=x86_64; elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then ARCHITECTURE=arm64; else ARCHITECTURE=arm64; fi  && \
#     wget https://github.com/chipsalliance/verible/releases/download/v0.0-3833-gcf1fc255/verible-v0.0-3833-gcf1fc255-linux-static-${ARCHITECTURE}.tar.gz && \
#     tar -C /usr/local --strip-components 1 -xf verible-v0.0-3833-gcf1fc255-linux-static-${ARCHITECTURE}.tar.gz 

# Make the locally installed things available in the path / global
ENV PATH="$PATH:/root/.local/bin/"
#RUN mv -rf /root/.local/bin/ /usr/local/bin/

# Graphviz for .dot files 
RUN apt-get -y install \
    graphviz

# Manta / FPGA on-device debugger (Depends on python being installed)
RUN pipx install git+https://github.com/fischermoseley/manta.git

# Install python and Cocotb utils 
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV 
RUN $VIRTUAL_ENV/bin/pip install \
    flake8 \
    isort \
    pytest \
    yapf \
    cocotb \
    cocotb-test \ 
    json5 

ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install netlist viewer (from drichmond / USC x25: https://github.com/UCSC-CSE-x25/dockerfiles/blob/main/base/Dockerfile )
# RUN apt-get -y install npm
# RUN git clone https://github.com/nturley/netlistsvg
# RUN cd netlistsvg && npm install --legacy-peer-deps && npm install -g .

# VHDL Support
# RUN apt-get -y install \
#     ghdl


# Expose the port used by the fpga server
EXPOSE 3000  

# Copy local files to image
COPY ./etc /etc
# Copy optional things, including the fpga server
COPY ./opt /opt



