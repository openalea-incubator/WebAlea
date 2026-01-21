# Tests
## Environment
The project uses Python and Coverage. We recommend using the Conda test environment (see [Setup Conda environment](#setup-conda-environment)).
## Launch Tests
You need to go to the backend directory:
```bash
cd webAleaBack
```
Change PYTHONPATH:
```bash
export PYTHONPATH=$PYTHONPATH:$(pwd)
```
Execute tests:
```bash
pytest
```
## Integration Tests
Integration tests cannot work without a proper conda test environment.
You can skip those by uncommenting the skip line before integration tests.
### Setup Conda Environment
Use the `tests/resources/environment.yml` file to set up the test environment.
```bash
conda env create -f tests/resources/environment.yml
conda activate webalea_test_env
```

After setup, you can run the tests following the steps in [Launch Tests](#launch-tests).