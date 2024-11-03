const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const db = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linksil')
        .setDescription('Link siler'),
    async execute(interaction) {
        try {
            const modal = new ModalBuilder()
                .setCustomId('linkSilModal')
                .setTitle('Link Sil');

            const linkInput = new TextInputBuilder()
                .setCustomId('linkInput')
                .setLabel("Silmek istediğiniz linki girin")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(linkInput);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        } catch (error) {
            console.error('Modal gösterme hatası:', error);
            await interaction.reply({ content: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', ephemeral: true });
        }
    },
    async handleModal(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const userId = interaction.user.id;
            const linkToDelete = interaction.fields.getTextInputValue('linkInput');

            if (!linkToDelete) {
                throw new Error('Link girişi boş olamaz.');
            }

            let userLinks = db.get(`links_${userId}`);
            if (!userLinks || !Array.isArray(userLinks)) {
                throw new Error('Kullanıcı link verisi bulunamadı veya hatalı.');
            }

            const initialLinkCount = userLinks.length;
            userLinks = userLinks.filter(link => link !== linkToDelete);

            if (userLinks.length === initialLinkCount) {
                throw new Error('Belirtilen link bulunamadı.');
            }

            db.set(`links_${userId}`, userLinks);

            const isPremium = db.get(`premium_${userId}`) || false;
            const maxLinks = isPremium ? 20 : 3;
            const remainingLinks = maxLinks - userLinks.length;

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Link Silme İşlemi')
                .setDescription('Link başarıyla silindi!')
                .addFields(
                    { name: 'Silinen Link', value: linkToDelete },
                    { name: 'Kalan Link Sayısı', value: `${userLinks.length}` },
                    { name: 'Kalan Link Hakkı', value: `${remainingLinks}` },
                    { name: 'Premium Durum', value: isPremium ? 'Premium Üye' : 'Normal Üye' }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Link silme hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Hata')
                .setDescription(error.message || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
