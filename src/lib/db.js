import { supabase } from "@/lib/supabase-client";

export const db = {
  entities: {
    Item: {
      /* 🔥 LIST ITEMS (flexible) */
      list: async ({ onlyActive = true } = {}) => {
        let query = supabase
          .from("items")
          .select("*")
          .order("created_date", { ascending: false });

        if (onlyActive) {
          query = query.eq("status", "active");
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
      },

      /* 🔥 GET USER ITEMS */
      listByUser: async (userId) => {
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", userId)
          .order("created_date", { ascending: false });

        if (error) throw error;
        return data || [];
      },

      /* 🔥 CREATE */
      create: async (item = {}) => {
        const { data, error } = await supabase
          .from("items")
          .insert([item])
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      /* 🔥 UPDATE (✅ FIXED FOR RLS) */
      update: async (id, updates = {}) => {
        // 🚫 ONLY allow safe fields (important for RLS)
        const allowedUpdates = {};

        if (updates.status !== undefined) {
          allowedUpdates.status = updates.status;
        }

        // (optional: allow editing title/description if you want)
        if (updates.title !== undefined) {
          allowedUpdates.title = updates.title;
        }

        if (updates.description !== undefined) {
          allowedUpdates.description = updates.description;
        }

        if (updates.category !== undefined) {
          allowedUpdates.category = updates.category;
        }

        if (updates.image_url !== undefined) {
          allowedUpdates.image_url = updates.image_url;
        }

        if (updates.location_name !== undefined) {
          allowedUpdates.location_name = updates.location_name;
        }

        if (updates.date !== undefined) {
          allowedUpdates.date = updates.date;
        }

        const { data, error } = await supabase
          .from("items")
          .update(allowedUpdates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      /* 🔥 DELETE */
      delete: async (id) => {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return true;
      },

      /* 🔥 GET ONE */
      getById: async (id) => {
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return data;
      },
    },
  },
};