const { Events, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketSetupSchema = require('../../Schema/TicketSetupSchema');
const UserColorSchema = require('../../Schema/UserColorSchema');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    if (interaction.customId === 'create_ticket') {
      try {
        const ticketConfig = await TicketSetupSchema.findOne({ guildId });
        if (!ticketConfig) {
          return interaction.reply({ content: 'Configuration de ticket introuvable. Veuillez exécuter la commande /ticket_setup.', ephemeral: true });
        }

        const existingTicket = interaction.guild.channels.cache.find(channel =>
          channel.name.startsWith('ticket-') &&
          channel.permissionOverwrites.cache.some(perm => perm.id === userId && perm.allow.has(PermissionFlagsBits.ViewChannel))
        );

        if (existingTicket) {
          return interaction.reply({ content: 'Vous avez déjà un ticket ouvert. Veuillez fermer le ticket actuel avant d\'en ouvrir un nouveau.', ephemeral: true });
        }

        const categoryId = ticketConfig.categoryId;
        const roleId = ticketConfig.roleId;
        const channelName = `ticket-${interaction.user.username}`;

        const userColorData = await UserColorSchema.findOne({ guildId });
        const embedColor = userColorData ? userColorData.color : 'Red';

        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: userId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
            },
            {
              id: roleId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle('Ticket Ouvert')
          .setDescription(`Bonjour ${interaction.user}, un membre de l'équipe de support sera avec vous bientôt.`)
          .setColor(embedColor);

        const closeButton = new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Fermer le ticket')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({ content: `<@&${roleId}> Nouveau ticket créé par <@${userId}>.`, embeds: [embed], components: [row] });

        await interaction.reply({ content: `Votre ticket a été créé : ${ticketChannel}`, ephemeral: true });

      } catch (error) {
        console.error('Erreur lors de la création du ticket:', error);
        await interaction.reply({ content: 'Une erreur est survenue lors de la création de votre ticket.', ephemeral: true });
      }
    }

    if (interaction.customId === 'close_ticket') {
      try {
        const channel = interaction.channel;

        if (!channel.name.startsWith('ticket-')) {
          return interaction.reply({ content: 'Ce bouton ne peut être utilisé que dans un canal de ticket.', ephemeral: true });
        }

        await channel.delete();
        
      } catch (error) {
        console.error('Erreur lors de la fermeture du ticket:', error);
        await interaction.reply({ content: 'Une erreur est survenue lors de la fermeture du ticket.', ephemeral: true });
      }
    }
  },
};
