"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { Save, Edit2 } from "lucide-react";
import api from "../../lib/axios";

export default function EditProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    gender: "",
    avatar: "/logo_batik.jpg",
  });

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      try {
        // Utamakan data terbaru dari API profil
        const response = await api.get("/auth/profile");
        if (response.data?.status && response.data?.data) {
          const data = response.data.data;
          setUser({
            name: data.name || "",
            username: data.username || data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            gender: data.gender || "",
            avatar: data.avatar || "/logo_batik.jpg",
          });

          // Simpan juga ke localStorage agar konsisten dengan halaman lain
          localStorage.setItem(
            "userData",
            JSON.stringify({
              name: data.name || "",
              username: data.username || data.name || "",
              phone: data.phone || "",
              email: data.email || "",
              gender: data.gender || "",
              avatar: data.avatar || "/logo_batik.jpg",
            })
          );
          return;
        }
      } catch (error) {
        console.error("Error loading profile from API, fallback ke localStorage:", error);
      }

      // Fallback ke localStorage jika API gagal
      const savedUser = localStorage.getItem("userData");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser({
          name: parsed.name || "",
          username: parsed.username || parsed.name || "",
          phone: parsed.phone || "",
          email: parsed.email || "",
          gender: parsed.gender || "",
          avatar: parsed.avatar || "/logo_batik.jpg",
        });
      }
    };

    loadUser();
  }, [router]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setUser({ ...user, avatar: imageURL });
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      // Upload avatar jika ada file
      let avatarUrl = user.avatar;
      if (user.avatar && user.avatar.startsWith("blob:")) {
        // Konversi blob ke file untuk upload
        const response = await fetch(user.avatar);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("avatar", blob, "avatar.jpg");
        
        const uploadResponse = await api.post("/upload/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (uploadResponse.data.status) {
          avatarUrl = uploadResponse.data.url;
        }
      }

      // Update profil ke database
      const updateData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        avatar: avatarUrl,
      };

      const updateResponse = await api.put("/auth/profile", updateData, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (updateResponse.data.status) {
        // Update localStorage
        localStorage.setItem("userData", JSON.stringify({
          ...updateData,
          avatar: avatarUrl,
        }));
        
        // Trigger event untuk update komponen lain
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { ...updateData, avatar: avatarUrl }
        }));
        
        alert("Profil berhasil diperbarui ✅");
        router.push("/profil");
      } else {
        alert("Gagal memperbarui profil: " + updateResponse.data.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Terjadi kesalahan saat memperbarui profil");
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar showBack />

      <div className="luxury-container max-w-2xl space-y-8 md:space-y-10">
        <section className="flex flex-col items-center gap-6 text-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-[#e3d6c5] bg-white/80 shadow-[0_20px_60px_-40px_rgba(91,55,23,0.75)] md:h-32 md:w-32">
            <Image
              src={user.avatar}
              alt="Foto Profil"
              fill
              className="object-cover"
            />
            <label
              htmlFor="avatarUpload"
              className="group absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-[#7b4d2a] text-white shadow-lg transition hover:translate-y-[1px] cursor-pointer"
            >
              <Edit2 size={16} />
            </label>
            <input
              id="avatarUpload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
              Perbarui Profilmu
            </h1>
            <p className="mt-2 text-sm text-[#5c3316]/70 max-w-md">
              Sempurnakan detail akun agar layanan dan rekomendasi batik kami semakin personal.
            </p>
          </div>
        </section>

        <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/90 px-6 py-6 backdrop-blur-md md:px-8 md:py-8 space-y-5">
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
            <span>Nama</span>
            <input
              type="text"
              name="name"
              value={user.name}
              onChange={handleChange}
              className="luxury-input"
              placeholder="Masukkan nama lengkap"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
            <span>Nama Pengguna</span>
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleChange}
              className="luxury-input"
              placeholder="Masukkan nama pengguna"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
            <span>No. HP</span>
            <input
              type="tel"
              name="phone"
              value={user.phone}
              onChange={handleChange}
              className="luxury-input"
              placeholder="Masukkan nomor HP"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              className="luxury-input"
              placeholder="Masukkan email"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
            <span>Gender</span>
            <select
              name="gender"
              value={user.gender}
              onChange={handleChange}
              className="luxury-input"
            >
              <option value="">Pilih Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </label>

          <button
            onClick={handleSave}
            className="luxury-button primary-button mt-4 flex w-full items-center justify-center gap-2 text-base"
          >
            <Save size={18} />
            Simpan Perubahan
          </button>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
