# Based on cs50/cli https://github.com/cs50/cli/

# Build stage
FROM ubuntu:24.04

# Build-time variables
ARG DEBIAN_FRONTEND=noninteractive
ARG BUILDARCH

# Stage-wide dependencies
RUN apt update && \
    apt install --no-install-recommends --no-install-suggests --yes \
        build-essential \
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

### General deveopment tools
RUN apt-get -y install \
    git \
    universal-ctags 

### Python development tools
RUN apt-get -y install \
    python3-pip \
    pipx

### Python development packages (some needed for cocotb)
RUN pipx install \
    flake8 \
    isort \
    pytest \
    yapf

# Generic verilog support tools
RUN apt-get -y install \
    iverilog \
    verilator \
    yosys 


# Python Verilog testbench tools 
RUN pipx install \
        cocotb \
        cocotb-test

# Manta / FPGA on-device debugger (Depends on python being installed)
RUN pipx install git+https://github.com/fischermoseley/manta.git

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

# Copy local files to image
COPY ./etc /etc
# Copy optional things, including the fpga server
COPY ./opt /opt
# Expose the port used by the fpga server
EXPOSE 3000  


# Make the locally installed things available in the path / global
ENV PATH="$PATH:/root/.local/bin/"
#RUN mv -rf /root/.local/bin/ /usr/local/bin/
