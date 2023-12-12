import BasicInfo from '@/components/BasicInfo.vue';
import AvatarUpload from '@/components/AvatarUpload.vue';

import translations from '@/translations.js';

import * as config from '@/config.js';

// eslint-disable-next-line no-undef
kiwi.plugin('asl', (kiwi, log) => {
    config.setDefaults(kiwi);

    kiwi.addTranslations(config.configBase, translations);

    if (!kiwi.userboxInfoPlugins.length) {
        kiwi.addUi('userbox_info', BasicInfo);
    }
    kiwi.addUi('userbox_info', AvatarUpload);

    kiwi.on('irc.account', (event, network) => {
        const user = kiwi.state.getUser(network.id, event.nick);
        if (!user) {
            return;
        }

        if (!event.account) {
            // User has logged out remove our avatars
            clearPluginAvatars(user.avatar);
        }

        kiwi.Vue.nextTick(() => {
            updateAvatar(user, true);
        });
    });

    kiwi.on('irc.wholist', (event, network) => {
        kiwi.Vue.nextTick(() => {
            event.users.forEach((whoUser) => {
                const user = kiwi.state.getUser(network.id, whoUser.nick);
                if (user && user.avatarCache) {
                    // Only process users that have already used their avatar
                    // Other users will be handled by the user.avatar.create event
                    updateAvatar(user, false);
                }
            });
        });
    });

    kiwi.on('user.avatar.create', (event) => {
        updateAvatar(event.user, false);
    });

    function updateAvatar(user, force = false) {
        if (!user.account) {
            return;
        }

        if (!force && hasPluginAvatars(user.avatar)) {
            // User already has an avatar and this is not a force event
            return;
        }

        const avatarsUrl = config.getSetting('avatars_url');
        const accountLower = user.account.toLowerCase();
        const smallUrl = avatarsUrl + `small/${accountLower}.png`;
        const largeUrl = avatarsUrl + `large/${accountLower}.png`;

        if (config.getSetting('preload_avatars')) {
            const img = new Image();
            img.onload = () => {
                Object.assign(user.avatar, {
                    small: smallUrl,
                    large: largeUrl,
                });
            };
            img.src = smallUrl;
        } else {
            Object.assign(user.avatar, {
                small: smallUrl,
                large: largeUrl,
            });
        }
    }

    function clearPluginAvatars(avatar) {
        const avatarsUrl = config.getSetting('avatars_url');
        Object.keys(avatar).forEach((key) => {
            if (avatar[key] && avatar[key].startsWith(avatarsUrl)) {
                avatar[key] = '';
            }
        });
    }

    function hasPluginAvatars(avatar) {
        const avatarsUrl = config.getSetting('avatars_url');
        return Object.keys(avatar).some(
            (key) => (avatar[key] && avatar[key].startsWith(avatarsUrl))
        );
    }
});
