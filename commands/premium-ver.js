const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require("croxydb");
const { bot_owner_id } = require("../config.json"); 

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('premium-ver')
        .setDescription('Belirtilen kullanıcıya premium statüsü verir.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Premium verilecek kullanıcı')
                .setRequired(true)),
    async execute(interaction) {
        // Yetki kontrolü (bot_owner_id kullanılıyor)
        if (!bot_owner_id.includes(interaction.user.id)) { 
            const yetkiYokEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Hata')
                .setDescription('Bu komutu kullanma yetkiniz yok.');
            return interaction.reply({ embeds: [yetkiYokEmbed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('kullanıcı');
        // Kullanıcı zaten premium mu kontrol et
        if (db.has(`premium_${targetUser.id}`)) {
            const zatenPremiumEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('Bilgi')
                .setDescription(`${targetUser.toString()} zaten premium üye.`);
            return interaction.reply({ embeds: [zatenPremiumEmbed], ephemeral: true });
        }

        // Premium ver
        db.set(`premium_${targetUser.id}`, true);
        const premiumVerildiEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Başarılı')
            .setDescription(`${targetUser.toString()} kullanıcısına premium üyelik verildi.`)
            .setTimestamp();
        await interaction.reply({ embeds: [premiumVerildiEmbed] });

        // Kullanıcıya özelden mesaj gönder
        try {
            const kullaniciMesajEmbed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle('Premium Üyelik')
                .setDescription('Tebrikler! Size premium üyelik verildi. Artık özel özelliklere erişebilirsiniz.');
            await targetUser.send({ embeds: [kullaniciMesajEmbed] });
        } catch (error) {
            console.error('Kullanıcıya özel mesaj gönderilemedi:', error);
        }
    },
};