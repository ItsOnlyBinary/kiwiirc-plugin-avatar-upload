import BasicInfo from '@/components/BasicInfo.vue';
import AvatarUpload from '@/components/AvatarUpload.vue';

import translations from '@/translations';

import * as config from '@/config.js';

// eslint-disable-next-line no-undef
kiwi.plugin('asl', (kiwi, log) => {
    config.setDefaults(kiwi);

    kiwi.addTranslations(config.configBase, translations);

    if (!kiwi.userboxInfoPlugins.length) {
        kiwi.addUi('userbox_info', BasicInfo);
    }
    kiwi.addUi('userbox_info', AvatarUpload);

    if (config.getSetting('set_avatars')) {
        if (kiwi.pluginAvatars) {
            kiwi.on('user.avatar', (event) => updateAvatar(event.network, event.user.nick, false));
        } else {
            listenForEvents();
        }
    }

    function listenForEvents() {
        kiwi.on('irc.join', (event, net) => {
            kiwi.Vue.nextTick(() => {
                updateAvatar(net, event.nick, false);
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

        kiwi.on('irc.account', (event, net) => {
            kiwi.Vue.nextTick(() => {
                updateAvatar(net, event.nick, true);
            });
        });
    }

    function updateAvatar(net, nick, _force) {
        const force = !!_force;
        const user = kiwi.state.getUser(net.id, nick);
        if (!user) {
            // Could not get the user
            return;
        }

        if (!user.account && user.avatar?.large) {
            // The user is not logged in but has a large avatar
            // Clear the avatar
            user.avatar.large = '';
            return;
        }

        if (!user.account) {
            // The user does not have an account
            return;
        }

        const avatarsUrl = config.getSetting('avatars_url');
        if (user.avatar?.large?.startsWith(avatarsUrl)) {
            // The user already has an uploaded avatar
            // make sure the small avatar is falsy, as it may have been set by the avatars plugin
            user.avatar.small = '';
            return;
        }

        if (!force && user.avatar?.large) {
            // User already has an avatar and this is not a force event
            return;
        }

        const url = avatarsUrl + user.account.toLowerCase() + '.png';

        if (config.getSetting('preload_avatars')) {
            const img = new Image();
            img.onload = () => {
                Object.assign(user.avatar, {
                    small: '',
                    large: url,
                });
            };
            img.src = url;
        } else {
            Object.assign(user.avatar, {
                small: '',
                large: url,
            });
        }
    }
});
