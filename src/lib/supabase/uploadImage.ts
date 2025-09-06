import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";

type UploadProps = {
    file: File | Buffer; // if coming from API route, might be a Buffer
    bucket: string;
    folder?: string;
};

export async function uploadImage({ file, bucket, folder = "" }: UploadProps) {
    const filename = uuidv4();

    const fileExtension =
        typeof file === "object" && "name" in file
            ? file.name.split(".").pop() || "jpg"
            : "jpg";

    const path = `${folder ? folder + "/" : ""}${filename}.${fileExtension}`;

    // 👇 now async
    const supabase = await createClient();

    const { data, error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) {
        console.error("Supabase upload error:", error);
        return {
            imageUrl: "",
            error: `Image upload failed: ${error.message || JSON.stringify(error)}`,
        };
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data?.path}`;

    return { imageUrl, error: "" };
}
