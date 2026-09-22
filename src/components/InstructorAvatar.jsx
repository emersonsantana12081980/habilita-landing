import React, { useState } from "react";
import { UserRound } from "lucide-react";
import { EMERSON_PHOTO } from "../data/instructors";

export function InstructorAvatar({ instructor, large = false }) {
  const [failedPhoto, setFailedPhoto] = useState("");
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-50 text-green-700 ${large ? "h-24 w-24" : "h-12 w-12"}`}
    >
      {instructor.photo && failedPhoto !== instructor.photo ? (
        <img
          src={instructor.photo}
          alt={`Foto de ${instructor.name}`}
          className={
            instructor.photo === EMERSON_PHOTO
              ? "absolute -left-[70%] -top-[8%] h-auto w-[600%] max-w-none"
              : "h-full w-full object-cover"
          }
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedPhoto(instructor.photo)}
        />
      ) : (
        <UserRound size={large ? 40 : 23} strokeWidth={1.5} />
      )}
    </div>
  );
}
