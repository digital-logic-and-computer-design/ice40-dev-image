# Also get ossschem release from https://github.com/markusdd/ossschem/releases 
case $TARGETARCH in
    "amd64")
    arch=x64
    ;;
    "arm64") 
    arch=arm64
    ;;
esac

build=`curl -s https://api.github.com/repos/markusdd/ossschem/releases/latest | grep browser_download_url | grep linux-$arch | cut -f4 -d\"`
wget --no-check-certificate $build -O build.tgz
tar xfz build.tgz
rm build.tgz

mv ossschem* /opt/ossschem
# add the bin to the path
export PATH="/opt/osschem/bin:$PATH"
