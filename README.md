# Spread-API-Buda

API created for interview with Buda.com
You can see the documentation [here](https://documenter.getpostman.com/view/16189355/2sA2r6ZREv)

You need to create and .env file with the following things:

```TS
PORT=<PORT> #For example 3000
BUDA_URL=<BUDA API URL>
```

To run with docker, first run the command to build:

```
docker build -t <IMAGE_NAME> .
```

And then run the command to run the image

```
docker run --rm -p <PORT>:<PORT> <IMAGE_NAME>

```
