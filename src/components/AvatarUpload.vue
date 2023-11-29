<template>
    <div v-if="$parent.isSelf && user.account" class="plugin-avatar-upload">
        <div class="plugin-avatar-upload-title">
            {{ $t('plugin-avatar-upload:title') }}
        </div>
        <vue-cropper
            v-if="showCropper"
            ref="cropper"
            :src="cropperSrc"
            v-bind="cropperOptions"
            class="plugin-avatar-upload-cropper"
            @error="handleError"
        />
        <div v-else-if="showUploading" class="plugin-avatar-upload-uploading">
            {{ $t('plugin-avatar-upload:uploading') }}
        </div>
        <div v-else-if="postError" class="plugin-avatar-upload-error">
            {{
                postError[0] === '_'
                    ? $t('plugin-avatar-upload:' + postError.substring(1))
                    : postError
            }}
        </div>
        <div class="plugin-avatar-upload-input">
            <button
                type="button"
                class="u-button u-button-primary"
                @click="chooseFile"
            >
                {{ $t('plugin-avatar-upload:choose') }}
            </button>
            <div class="plugin-avatar-upload-file-name">{{ fileName }}</div>
            <button
                type="button"
                class="u-button u-button-primary"
                :style="{ visibility: showCropper ? 'visible' : 'hidden' }"
                @click="uploadImage"
            >
                {{ $t('plugin-avatar-upload:upload') }}
            </button>
        </div>
        <input
            ref="file"
            type="file"
            accept="image/*"
            @change="handleFileChange"
        />
    </div>
</template>

<script>
import VueCropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';

import * as config from '@/config.js';

export default {
    components: {
        VueCropper,
    },
    props: ['network', 'user'],
    data() {
        return {
            showCropper: false,
            showUploading: false,

            cropperSrc: null,
            cropperOptions: {
                viewMode: 1,
                aspectRatio: 1,
                dragMode: 'move',
            },
            fileName: '',
            postError: '',
        };
    },
    methods: {
        chooseFile() {
            this.$refs.file.value = '';
            this.$refs.file.click();
        },
        handleFileChange(event) {
            this.showCropper = false;
            this.postError = '';
            this.fileName = '';

            const file = event.target.files[0];
            if (file) {
                this.fileName = file.name || '';
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.showCropper = true;
                    this.cropperSrc = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        },
        handleError() {
            const cropper = this.$refs.cropper;
            cropper.destroy();
            this.showCropper = false;
            this.postError = '_invalid';
        },
        uploadImage() {
            this.showUploading = true;
            this.postError = '';

            this.getExtjwtToken(this.network)
                .then((token) => {
                    const cropper = this.$refs.cropper;
                    const croppedCanvas = cropper.getCroppedCanvas({
                        width: 200,
                        height: 200,
                    });
                    cropper.destroy();
                    this.showCropper = false;

                    if (!croppedCanvas) {
                        this.showUploading = false;
                        this.postError = '_invalid';
                        return;
                    }

                    croppedCanvas.toBlob((blob) => {
                        const formData = new FormData();
                        formData.append('image', blob);

                        fetch(config.getSetting('api_url'), {
                            method: 'POST',
                            headers: {
                                authorization: token,
                            },
                            body: formData,
                        })
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error();
                                }
                                const avatarUrl =
                                    config.getSetting('avatars_url');
                                const lcAccount =
                                    this.user.account.toLowerCase();
                                Object.assign(this.user.avatar, {
                                    small: '',
                                    large:
                                        avatarUrl +
                                        lcAccount +
                                        '.png?cb=' +
                                        Date.now(),
                                });
                            })
                            .catch(() => {
                                this.postError = '_error';
                            })
                            .finally(() => {
                                this.showUploading = false;
                                this.$refs.file.value = '';
                                this.fileName = '';
                            });
                    }, 'image/png');
                })
                .catch(() => {
                    this.postError = '_token';
                    this.showUploading = false;
                });
        },
        getExtjwtToken(network) {
            return new Promise((resolve, reject) => {
                let fullToken = '';

                const timeout = setTimeout(() => {
                    this.$state.$off('irc.raw.EXTJWT', callback);
                    reject();
                }, 4000);

                const callback = (command, event, eventNetwork) => {
                    if (network !== eventNetwork) {
                        // Not a token for this network
                        return;
                    }

                    event.handled = true;
                    fullToken += event.params[event.params.length - 1];
                    if (event.params.length === 4) {
                        // Incomplete token, it will continue in the next message
                        return;
                    }
                    clearTimeout(timeout);
                    this.$state.$off('irc.raw.EXTJWT', callback);

                    // Resolve the promise
                    resolve(fullToken);
                };

                this.$state.$on('irc.raw.EXTJWT', callback);
                network.ircClient.raw('EXTJWT', '*');
            });
        },
    },
};
</script>

<style lang="less">
.plugin-avatar-upload {
    padding: 0.5em;
    border-bottom: 1px solid var(--brand-midtone);

    > input {
        display: none;
    }
}

.plugin-avatar-upload-title {
    font-size: 1.1em;
    font-weight: 900;
    line-height: 1.1em;
    text-align: center;
}

.plugin-avatar-upload-cropper {
    width: 100%;
    margin-top: 0.5em;

    .cropper-view-box {
        border-radius: 50%;
        /* stylelint-disable-next-line declaration-no-important */
        outline: inherit !important;
        box-shadow: 0 0 0 1px #39f;
    }

    .cropper-face {
        /* stylelint-disable-next-line declaration-no-important */
        background-color: inherit !important;
    }
}

.plugin-avatar-upload-uploading,
.plugin-avatar-upload-error {
    margin-top: 0.5em;
    text-align: center;
}

.plugin-avatar-upload-uploading {
    padding: 0.5em;
    font-weight: 700;
    color: var(--brand-primary);
}

.plugin-avatar-upload-error {
    background: #ffbaba;
    border: 2px solid var(--brand-error);
}

.plugin-avatar-upload-input {
    display: flex;
    flex-direction: row;
    margin-top: 0.5em;
}

.plugin-avatar-upload-file-name {
    flex-grow: 1;
    align-self: center;
    margin: 0 0.5em;
    overflow-x: hidden;
    text-align: center;
    text-overflow: ellipsis;
}
</style>
