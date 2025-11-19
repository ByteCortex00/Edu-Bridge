import { Webhook } from 'svix';
import User from '../models/userModel.js';

// You need to add this to your .env file
// CLERK_WEBHOOK_SECRET=whsec_... (Get this from Clerk Dashboard > Webhooks)

export const handleClerkWebhook = async (req, res) => {
  try {
    const payloadString = req.body.toString();
    const svixHeaders = req.headers;

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(payloadString, svixHeaders);
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook verification failed',
      });
    }

    const { id, ...attributes } = evt.data;
    const eventType = evt.type;

    console.log(`🔔 Webhook received: ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { email_addresses, first_name, last_name, image_url, public_metadata } = attributes;

      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];

      // Determine role (default to 'institution' if not specified)
      // This fixes the "viewer" issue permanently
      let role = public_metadata?.role || 'institution';

      // Admin override check
      if (email.includes('admin') && !public_metadata?.role) {
        role = 'admin';
      }

      const userData = {
        clerkId: id,
        email,
        name,
        profileImage: image_url,
        role: role,
        institutionId: public_metadata?.institutionId || null,
      };

      await User.findOneAndUpdate(
        { clerkId: id },
        userData,
        { upsert: true, new: true }
      );

      console.log(`✅ User synced via webhook: ${email} (${role})`);
    }

    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`🗑️ User deleted via webhook: ${id}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};