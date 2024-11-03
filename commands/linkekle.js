const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const db = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkekle')
        .setDescription('Bir link ekler.'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('linkEkleModal')
            .setTitle('Link Ekle');
        const linkInput = new TextInputBuilder()
            .setCustomId('linkInput')
            .setLabel("Eklemek istediğiniz linki girin")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        const actionRow = new ActionRowBuilder().addComponents(linkInput);
        modal.addComponents(actionRow);
        await interaction.showModal(modal);
    },
    async handleModal(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const link = interaction.fields.getTextInputValue('linkInput');
            const userId = interaction.user.id;
            
            let userLinks = db.get(`links_${userId}`) || [];
            const isPremium = db.get(`premium_${userId}`);
            const maxLinksPerUser = isPremium ? 20 : 3;
            
            if (userLinks.some(existingLink => existingLink.toLowerCase() === link.toLowerCase())) {
                return await interaction.editReply('Bu link zaten listenizde bulunuyor.');
            }
            
            if (userLinks.length >= maxLinksPerUser) {
                return await interaction.editReply(`En fazla ${maxLinksPerUser} link ekleyebilirsiniz. ${isPremium ? '(Premium)' : '(Normal kullanıcı)'}`);
            }
            
            userLinks.push(link);
            db.set(`links_${userId}`, userLinks);
            
            const remainingLinks = maxLinksPerUser - userLinks.length;
            const statusMessage = isPremium ? 'Premium kullanıcısınız' : 'Normal kullanıcısınız';
            
            await interaction.editReply(`Yeni bir link başarıyla eklendi!\nToplam link sayınız: ${userLinks.length}\nKalan link hakkınız: ${remainingLinks}\nDurum: ${statusMessage}`);
        } catch (error) {
            console.error('handleModal\'da hata:', error);
            await interaction.editReply('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
};