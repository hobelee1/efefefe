const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('croxydb');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminprofil')
        .setDescription('Kullanıcıların linklerini gizli olarak gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Linklerine bakmak istediğiniz kullanıcı')),
    async execute(interaction) {
        const ownerId = config.bot_owner_id;
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: 'Bu komutu kullanma izniniz yok.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('kullanici');
        let embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Kullanıcı Linkleri')
            .setTimestamp();

        if (user) {
            const links = db.get(`links_${user.id}`) || [];
            if (links.length > 0) {
                embed.setDescription(`${user.tag} için linkler:`)
                    .addFields(links.map((link, index) => ({
                        name: `Link ${index + 1}`,
                        value: link
                    })));
            } else {
                embed.setDescription(`${user.tag} için hiç link yok.`);
            }
        } else {
            const guildMembers = await interaction.guild.members.fetch();
            let hasLinks = false;

            for (const [memberId, member] of guildMembers) {
                const links = db.get(`links_${memberId}`) || [];
                if (links.length > 0) {
                    hasLinks = true;
                    embed.addFields({
                        name: member.user.tag,
                        value: links.join('\n')
                    });
                }
            }

            if (!hasLinks) {
                embed.setDescription('Hiçbir kullanıcının linki yok.');
            }
        }

        // Embed boyutu sınırını kontrol et ve gerekirse böl
        if (embed.data.fields && embed.data.fields.length > 25) {
            const chunks = [];
            for (let i = 0; i < embed.data.fields.length; i += 25) {
                const chunkEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Kullanıcı Linkleri (Sayfa ${chunks.length + 1})`)
                    .setFields(embed.data.fields.slice(i, i + 25))
                    .setTimestamp();
                chunks.push(chunkEmbed);
            }

            await interaction.editReply({ embeds: [chunks[0]], ephemeral: true });
            for (let i = 1; i < chunks.length; i++) {
                await interaction.followUp({ embeds: [chunks[i]], ephemeral: true });
            }
        } else {
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    },
};