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

    kiwi.on('irc.account', (event, net) => {
        if (!event.account) {
            // User has logged out remove our avatars
            const user = kiwi.state.getUser(net.id, event.nick);
            if (user) {
                clearPluginAvatars(user.avatar);
            }
        }

        kiwi.Vue.nextTick(() => {
            updateAvatar(net, event.nick, true);
        });
    });

    kiwi.on('irc.wholist', (event, net) => {
        const nicks = event.users.map((user) => user.nick);
        kiwi.Vue.nextTick(() => {
            nicks.forEach((nick) => {
                updateAvatar(net, nick, false);
            });
        });
    });

    kiwi.on('irc.join', (event, net) => {
        kiwi.Vue.nextTick(() => {
            updateAvatar(net, event.nick, false);
        });
    });

    function updateAvatar(network, nick, force = false) {
        const user = kiwi.state.getUser(network.id, nick);
        if (!user) {
            // Could not get the user
            return;
        }

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
