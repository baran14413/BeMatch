'use client';
import { useLanguage } from "@/context/language-context";
import LikesGrid from "@/components/discover/likes-you";
import { useEffect } from "react";

export default function LikesPage() {
    const { t } = useLanguage();

    useEffect(() => {
        // When the user visits this page, update the timestamp in localStorage
        // to indicate they have seen the latest likes.
        localStorage.setItem('lastLikesViewTimestamp', new Date().toISOString());
        // Dispatch a custom event to notify other components (like the header) immediately.
        window.dispatchEvent(new CustomEvent('likes-viewed'));
    }, []);

    return (
        <div className="h-full flex flex-col">
            <LikesGrid />
        </div>
    )
}
