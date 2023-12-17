FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04
ARG TORCH_CUDA_ARCH_LIST="${TORCH_CUDA_ARCH_LIST:-3.5;5.0;6.0;6.1;7.0;7.5;8.0;8.6}"
ARG APP_UID="${APP_UID:-6972}"
ARG APP_GID="${APP_GID:-6972}"
ENV CLI_ARGS=""
# create / update runtime env
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked,rw \
    --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=type=cache,target=/home/app/.cache \
    --mount=type=cache,target=/root/.cache \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt update && \
    apt install --no-install-recommends -y git python3 python3-dev pip gcc g++ && \
    pip3 install --global --upgrade pip wheel setuptools && \
    # make shared builder & runtime app user
    addgroup --gid $APP_GID app_grp && \
    useradd -m -u $APP_UID --gid app_grp app && \
    chown -R $APP_UID:$APP_GID /home/app

RUN chown -R $APP_UID:$APP_GID /home/app
USER app:app_grp
COPY --chown=app:app_grp requirements.txt /home/app/tts/
WORKDIR /home/app/tts
RUN --mount=type=cache,target=/home/app/.cache pip3 install -r requirements.txt
COPY --chown=app:app_grp . /home/app/tts
CMD export HOME=/home/app && weight_root=assets/weights index_root=logs rmvpe_root=assets/rmvpe /home/app/.local/bin/uvicorn --host 0.0.0.0 --port 8000 --root-path /tts main:app
