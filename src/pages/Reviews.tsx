import React from 'react';
import { motion } from 'motion/react';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Reviews() {
  const reviews = [
    { id: 1, user: "AlexGamer", rating: 5, comment: "Instant delivery and the account was exactly as described. Best shop for Fortnite accounts!", date: "2 hours ago" },
    { id: 2, user: "Slayer99", rating: 5, comment: "Got a Renegade Raider account for a steal. 100% legit.", date: "5 hours ago" },
    { id: 3, user: "FortniteFan", rating: 4, comment: "Great service, had a small issue with login but support fixed it in 5 minutes.", date: "1 day ago" },
    { id: 4, user: "OG_Collector", rating: 5, comment: "Finally found a reliable place for rare skins. GameVault is the goat.", date: "2 days ago" },
    { id: 5, user: "VBucksMaster", rating: 5, comment: "Bought a mystery box and got 5000 V-Bucks! Insane value.", date: "3 days ago" },
    { id: 6, user: "Xenon_Gamer", rating: 5, comment: "The best experience I've ever had buying an account. Fast and secure.", date: "4 days ago" },
    { id: 7, user: "Shadow_Strike", rating: 5, comment: "Amazing support team. They helped me with everything.", date: "5 days ago" },
    { id: 8, user: "Loot_Llama", rating: 5, comment: "Got the Galaxy skin! I'm so happy right now.", date: "6 days ago" },
    { id: 9, user: "Victory_Royale", rating: 5, comment: "Highly recommend this shop. Very professional.", date: "1 week ago" },
    { id: 10, user: "Storm_Chaser", rating: 5, comment: "Everything was perfect. No issues at all.", date: "1 week ago" },
    { id: 11, user: "Pixel_Warrior", rating: 5, comment: "The account had even more skins than advertised. Wow!", date: "1 week ago" },
    { id: 12, user: "Cyber_Ninja", rating: 5, comment: "Fastest delivery I've ever seen. Literally seconds.", date: "2 weeks ago" },
    { id: 13, user: "Gamer_Girl_99", rating: 5, comment: "So many rare items for such a low price. Love it!", date: "2 weeks ago" },
    { id: 14, user: "Pro_Sniper", rating: 5, comment: "The best shop for Fortnite assets. Period.", date: "2 weeks ago" },
    { id: 15, user: "Elite_Gamer", rating: 5, comment: "I was skeptical at first, but GameVault is 100% legit.", date: "3 weeks ago" },
    { id: 16, user: "Mythic_Loot", rating: 5, comment: "Got a Black Knight account! My dream came true.", date: "3 weeks ago" },
    { id: 17, user: "Legendary_Player", rating: 5, comment: "Great prices and even better service.", date: "3 weeks ago" },
    { id: 18, user: "Epic_Wins", rating: 5, comment: "The support team is very friendly and helpful.", date: "1 month ago" },
    { id: 19, user: "Gaming_King", rating: 5, comment: "I've bought multiple accounts here and never had a problem.", date: "1 month ago" },
    { id: 20, user: "Rare_Skins_Only", rating: 5, comment: "The selection of accounts is amazing.", date: "1 month ago" },
    { id: 21, user: "Fortnite_God", rating: 5, comment: "Best value for money. Highly recommended.", date: "1 month ago" },
    { id: 22, user: "Skin_Collector_X", rating: 5, comment: "Found some really rare vaulted skins here.", date: "2 months ago" },
    { id: 23, user: "Battle_Pass_Pro", rating: 5, comment: "The delivery was instant and the account works perfectly.", date: "2 months ago" },
    { id: 24, user: "OG_Gamer_88", rating: 5, comment: "GameVault is the only place I trust for accounts.", date: "2 months ago" },
    { id: 25, user: "Loot_Master", rating: 5, comment: "Got an account with 200+ skins for a great price.", date: "2 months ago" },
    { id: 26, user: "Victory_Hunter", rating: 5, comment: "The best customer service I've ever experienced.", date: "3 months ago" },
    { id: 27, user: "Pro_Player_Z", rating: 5, comment: "Fast, secure, and reliable. What more can you ask for?", date: "3 months ago" },
    { id: 28, user: "Gaming_Legend_7", rating: 5, comment: "I'm very satisfied with my purchase. Thank you!", date: "3 months ago" },
    { id: 29, user: "Rare_Item_Finder", rating: 5, comment: "The account was exactly as described. No surprises.", date: "3 months ago" },
    { id: 30, user: "Fortnite_Expert", rating: 5, comment: "I'll definitely be buying from here again.", date: "4 months ago" },
    { id: 31, user: "Skin_Enthusiast", rating: 5, comment: "The best shop for Fortnite skins. Period.", date: "4 months ago" },
    { id: 32, user: "Battle_Royale_King", rating: 5, comment: "Everything was smooth and easy. Highly recommend.", date: "4 months ago" },
    { id: 33, user: "OG_Account_Hunter", rating: 5, comment: "Got a very rare account for a very low price.", date: "4 months ago" },
    { id: 34, user: "Loot_Box_Fan", rating: 5, comment: "The mystery boxes are so much fun! Got great rewards.", date: "5 months ago" },
    { id: 35, user: "Victory_Royale_99", rating: 5, comment: "The best service and support. 5 stars!", date: "5 months ago" },
    { id: 36, user: "Pro_Gamer_Xenon", rating: 5, comment: "I've tried other shops, but GameVault is the best.", date: "5 months ago" },
    { id: 37, user: "Gaming_Pro_88", rating: 5, comment: "The delivery is literally instant. Amazing!", date: "5 months ago" },
    { id: 38, user: "Rare_Skin_Lover", rating: 5, comment: "So many rare skins to choose from. Love it!", date: "6 months ago" },
    { id: 39, user: "Fortnite_Fanatic", rating: 5, comment: "The best shop for all things Fortnite.", date: "6 months ago" },
    { id: 40, user: "Skin_Master_Z", rating: 5, comment: "I'm very happy with my purchase. Highly recommend.", date: "6 months ago" },
    { id: 41, user: "Battle_Pass_Master", rating: 5, comment: "The account works perfectly. No issues at all.", date: "6 months ago" },
    { id: 42, user: "OG_Gamer_Ninja", rating: 5, comment: "GameVault is the goat. Best shop ever.", date: "7 months ago" },
    { id: 43, user: "Loot_Llama_Fan", rating: 5, comment: "Got an amazing account for a steal. Thank you!", date: "7 months ago" },
    { id: 44, user: "Victory_Hunter_X", rating: 5, comment: "The support team is very helpful and friendly.", date: "7 months ago" },
    { id: 45, user: "Pro_Player_Elite", rating: 5, comment: "Fast, secure, and reliable. Highly recommended.", date: "7 months ago" },
    { id: 46, user: "Gaming_Legend_X", rating: 5, comment: "I'm very satisfied with my purchase. 5 stars!", date: "8 months ago" },
    { id: 47, user: "Rare_Item_Hunter", rating: 5, comment: "The account was exactly as described. Perfect.", date: "8 months ago" },
    { id: 48, user: "Fortnite_Pro_88", rating: 5, comment: "I'll definitely be back for more. Best shop!", date: "8 months ago" },
    { id: 49, user: "Skin_Collector_Z", rating: 5, comment: "The best selection of rare skins I've seen.", date: "8 months ago" },
    { id: 50, user: "Battle_Royale_Pro", rating: 5, comment: "Everything was perfect. Highly recommend GameVault.", date: "9 months ago" },
    { id: 51, user: "OG_Account_Master", rating: 5, comment: "Got a very rare account for a great price.", date: "9 months ago" },
    { id: 52, user: "Loot_Box_Master", rating: 5, comment: "The mystery boxes are amazing value. Got 10k V-Bucks!", date: "9 months ago" },
    { id: 53, user: "Victory_Royale_Pro", rating: 5, comment: "The best service and support. Highly recommended.", date: "9 months ago" },
    { id: 54, user: "Pro_Gamer_Elite_X", rating: 5, comment: "I've bought multiple accounts here. Always perfect.", date: "10 months ago" },
    { id: 55, user: "Gaming_Pro_Ninja", rating: 5, comment: "The delivery is instant. Best shop for Fortnite.", date: "10 months ago" },
    { id: 56, user: "Rare_Skin_Hunter_X", rating: 5, comment: "So many rare skins. I'm in heaven!", date: "10 months ago" },
    { id: 57, user: "Fortnite_Fan_99", rating: 5, comment: "The best shop for all your Fortnite needs.", date: "10 months ago" },
    { id: 58, user: "Skin_Master_Elite", rating: 5, comment: "I'm very happy with my purchase. 5 stars!", date: "11 months ago" },
    { id: 59, user: "Battle_Pass_Elite", rating: 5, comment: "The account works perfectly. No issues.", date: "11 months ago" },
    { id: 60, user: "OG_Gamer_Master_X", rating: 5, comment: "GameVault is the only shop I trust. Best ever.", date: "11 months ago" },
    { id: 61, user: "Loot_Llama_Master", rating: 5, comment: "Got an amazing account for a great price. Thanks!", date: "11 months ago" },
    { id: 62, user: "Victory_Hunter_Elite", rating: 5, comment: "The support team is amazing. Very helpful.", date: "1 year ago" },
    { id: 63, user: "Pro_Player_Ninja_X", rating: 5, comment: "Fast, secure, and reliable. Highly recommended.", date: "1 year ago" },
    { id: 64, user: "Gaming_Legend_Elite", rating: 5, comment: "I'm very satisfied with my purchase. Perfect.", date: "1 year ago" },
    { id: 65, user: "Rare_Item_Master_X", rating: 5, comment: "The account was exactly as described. Love it!", date: "1 year ago" },
    { id: 66, user: "Fortnite_Pro_Ninja", rating: 5, comment: "I'll definitely be back. Best shop for accounts.", date: "1 year ago" },
    { id: 67, user: "Skin_Collector_Elite", rating: 5, comment: "The best selection of rare skins. Period.", date: "1 year ago" },
    { id: 68, user: "Battle_Royale_Elite", rating: 5, comment: "Everything was perfect. Highly recommend GameVault.", date: "1 year ago" },
    { id: 69, user: "OG_Account_Ninja_X", rating: 5, comment: "Got a very rare account for a steal. Thank you!", date: "1 year ago" },
    { id: 70, user: "Loot_Box_Ninja_X", rating: 5, comment: "The mystery boxes are so much fun. Great rewards.", date: "1 year ago" },
    { id: 71, user: "Victory_Royale_Ninja", rating: 5, comment: "The best service and support. 5 stars!", date: "1 year ago" },
    { id: 72, user: "Pro_Gamer_Master_Elite", rating: 5, comment: "I've bought many accounts here. Always perfect.", date: "1 year ago" },
    { id: 73, user: "Gaming_Pro_Elite_X", rating: 5, comment: "The delivery is instant. Best shop ever.", date: "1 year ago" },
    { id: 74, user: "Rare_Skin_Master_Elite", rating: 5, comment: "So many rare skins. I'm very happy!", date: "1 year ago" },
    { id: 75, user: "Fortnite_Fan_Elite_X", rating: 5, comment: "The best shop for all things Fortnite. Love it!", date: "1 year ago" },
    { id: 76, user: "Skin_Master_Ninja_X", rating: 5, comment: "I'm very satisfied with my purchase. Highly recommend.", date: "1 year ago" },
    { id: 77, user: "Battle_Pass_Ninja_X", rating: 5, comment: "The account works perfectly. No issues at all.", date: "1 year ago" },
    { id: 78, user: "OG_Gamer_Elite_Ninja", rating: 5, comment: "GameVault is the goat. Best shop for accounts.", date: "1 year ago" },
    { id: 79, user: "Loot_Llama_Elite_X", rating: 5, comment: "Got an amazing account for a great price. Thanks!", date: "1 year ago" },
    { id: 80, user: "Victory_Hunter_Master_X", rating: 5, comment: "The support team is very helpful and friendly.", date: "1 year ago" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold mb-4"
        >
          Customer Reviews
        </motion.h1>
        <p className="text-gray-400 text-lg">See what our community has to say about GameVault</p>
        
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="flex text-yellow-500">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-6 w-6 fill-current" />)}
          </div>
          <span className="text-2xl font-bold ml-2">4.9/5</span>
          <span className="text-gray-500 ml-2">(50,000+ reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.map((review, i) => (
          <motion.div 
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:bg-white/10 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-violet-600/20 flex items-center justify-center font-bold text-violet-400">
                  {review.user.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {review.user}
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  </h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{review.date}</p>
                </div>
              </div>
              <div className="flex text-yellow-500">
                {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed italic">"{review.comment}"</p>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" />
              Verified Purchase
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <p className="text-gray-500 mb-8">Want to leave a review? You can do so after completing a purchase.</p>
        <div className="inline-flex items-center gap-8 px-12 py-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">99%</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Satisfaction</div>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">24/7</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Support</div>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">Instant</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
}
