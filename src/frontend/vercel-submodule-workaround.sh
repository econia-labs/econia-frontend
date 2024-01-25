
# Check if cloning is enabled
if [ "$TRY_CLONING_TRADINGVIEW" != "1" ]; then
  echo "Skip clone chart module"
  exit 0  # Exit without an error, as it's intentional to skip the clone
fi

# github submodule repo address without https:// prefix
SUBMODULE_GITHUB=github.com/tradingview/charting_library.git

# .gitmodules submodule path
SUBMODULE_PATH=public/static

# github access token is necessary
# add it to Environment Variables on Vercel
if [ "$GITHUB_ACCESS_TOKEN" == "" ]; then
  echo "Error: GITHUB_ACCESS_TOKEN is empty"
  exit 1
fi

# stop execution on error - don't let it build if something goes wrong
set -e

# get submodule commit
output=`git submodule status --recursive` # get submodule info
# no_prefix=${output#*-} # get rid of the prefix
# COMMIT=${no_prefix% *} # get rid of the suffix

# set up an empty temporary work directory
rm -rf tmp || true # remove the tmp folder if exists
mkdir tmp # create the tmp folder
cd tmp # go into the tmp folder

# checkout the current submodule commit
git init # initialise empty repo
git remote add origin https://$GITHUB_ACCESS_TOKEN@$SUBMODULE_GITHUB # add origin of the submodule
git fetch origin master # fetch only the required version
git checkout master # checkout on the right commit

# move the submodule from tmp to the submodule path
cd .. # go folder up
rm -rf tmp/.git # remove .git 
ls
mv tmp/* $SUBMODULE_PATH/ # move the submodule to the submodule path

# clean up
rm -rf tmp # remove the tmp folder