const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Kendi profil bilgilerini gösterir.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const links = db.get(`links_${userId}`) || [];

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Profil Bilgileri')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (links.length === 0) {
            embed.setDescription('Hiç link eklemedin.');
        } else {
            embed.setDescription('Profil linklerin:');
            links.forEach((link, index) => {
                const splitLink = link.split('/');
                const hiddenLink = `${splitLink[0]}//${splitLink[2]}/.../${splitLink[splitLink.length - 1]}`;
                embed.addFields({ name: `Link ${index + 1}`, value: hiddenLink });
            });
        }

        // Kullanıcının premium durumunu kontrol et
        const isPremium = db.get(`premium_${userId}`) || false;
        embed.addFields({ name: 'Premium Durum', value: isPremium ? 'Premium Üye' : 'Normal Üye' });

        // Kalan link hakkını hesapla ve göster
        const maxLinks = isPremium ? 20 : 3; // Premium kullanıcılar için 20, normal kullanıcılar için 3 link hakkı
        const remainingLinks = maxLinks - links.length;
        embed.addFields({ name: 'Kalan Link Hakkı', value: `${remainingLinks}` });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};