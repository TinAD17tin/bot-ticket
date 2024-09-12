const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const TicketSetupSchema = require('../../Schema/TicketSetupSchema');
const UserColorSchema = require('../../Schema/UserColorSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket_setup')
    .setDescription('Configurer le système de ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Le canal où l\'embed de ticket sera envoyé.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    .addRoleOption(option =>
      option.setName('rolestaff')
        .setDescription('Le rôle du staff qui aura accès aux tickets.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Le titre de l\'embed.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('La description de l\'embed.')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('category')
        .setDescription('La catégorie où les tickets seront créés.')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const roleStaff = interaction.options.getRole('rolestaff');
    const embedTitle = interaction.options.getString('title');
    const embedDescription = interaction.options.getString('description');
    const category = interaction.options.getChannel('category');
    const guildId = interaction.guild.id;

    const userColorData = await UserColorSchema.findOne({ guildId });
    const embedColor = userColorData ? userColorData.color : 'Red';

    try {
      const existingConfig = await TicketSetupSchema.findOne({ guildId });
      if (existingConfig) {
        return interaction.reply({ content: 'Un système de ticket est déjà configuré pour ce serveur.', ephemeral: true });
      }

      await TicketSetupSchema.findOneAndUpdate(
        { guildId },
        {
          channelId: channel.id,
          roleId: roleStaff.id,
          embedTitle: embedTitle,
          embedDescription: embedDescription,
          categoryId: category.id
        },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(embedDescription)
        .setColor(embedColor);

      const button = {
        type: 1,
        components: [
          {
            type: 2,
            label: "Créer un ticket",
            style: 1,
            custom_id: "create_ticket"
          }
        ]
      };

      await channel.send({ embeds: [embed], components: [button] });

      await interaction.reply({ content: `Configuration du système de ticket effectuée dans ${channel}.`, ephemeral: true });

    } catch (error) {
      console.error('Erreur lors de la configuration du système de ticket:', error);
      await interaction.reply({ content: 'Une erreur est survenue lors de la configuration du système de ticket.', ephemeral: true });
    }
  },
};
