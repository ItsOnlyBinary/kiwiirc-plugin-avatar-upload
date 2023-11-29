<template>
    <div v-if="$parent.realname" class="kiwi-userbox-basicinfo">
        <span class="kiwi-userbox-basicinfo-title">{{ $t('whois_realname') }}:</span>
        <span class="kiwi-userbox-basicinfo-data" v-html="$parent.formattedRealname" />
    </div>
</template>

<script>
export default {
};
</script>
