import { localDb } from "@/indexdb";
import { cn } from "@/lib/utils";
import { LucideFile, LucideFolderClosed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCommonDialog } from "./common-dialog";
import { unsupportFileHandlerDialogContent } from "./screen-dropzone";
import { Button, buttonVariants } from "./ui/button";


async function openFileHandler() {
  const [newFileHandler] = await window.showOpenFilePicker({
    types: [
      {
        description: "SQLite Files",
        accept: {
          "application/x-sqlite3": [
            ".db",
            ".sdb",
            ".sqlite",
            ".db3",
            ".s3db",
            ".sqlite3",
            ".sl3",
            ".db2",
            ".s2db",
            ".sqlite2",
            ".sl2",
          ],
        },
      },
    ],
  });

  const id = crypto.randomUUID();
  localDb.file_handler.add({ id, handler: newFileHandler }).then();

  return id;
}

export default function FileHandlerPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (file: string) => void;
}) {
  const [handler, setHandler] = useState<FileSystemHandle>();
  const { showDialog } = useCommonDialog();

  useEffect(() => {
    if (value) {
      localDb.file_handler.get(value).then((data) => {
        if (data?.handler) {
          setHandler(data.handler);
        }
      });
    }
  }, [value]);

  const onChangeFile = useCallback(() => {
    try {

      openFileHandler
      onChange
      // .catch(() => {
      //   showDialog(unsupportFileHandlerDialogContent);
      // });
    } catch {
      showDialog(unsupportFileHandlerDialogContent);
    }
  }, [onChange, showDialog]);

  if (handler) {
    return (
      <div
        onClick={onChangeFile}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start cursor-pointer"
        )}
      >
        <LucideFile className="w-4 h-4 mr-2" />
        {handler.name}
      </div>
    );
  }

  return (
    <Button onClick={onChangeFile} variant={"outline"}>
      <LucideFolderClosed className="w-4 h-4 mr-2" />
      Open File
    </Button>
  );
}
