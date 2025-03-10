import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDatabaseDriver } from "@/context/driver-provider";
import { useCallback, useState } from "react";

interface CreateNamespaceButtonProps {
  onCreated: (v: any) => void;
  onClose: () => void;
}

export default function CreateNamespaceDialog({
  onCreated,
  onClose,
}: CreateNamespaceButtonProps) {
  const { docDriver } = useDatabaseDriver();
  const [namespace, setNamespace] = useState("");
  const [error, setError] = useState("");

  const onCreateNamespace = useCallback(() => {
    if (docDriver) {
      if (namespace && namespace.length > 2) {
        docDriver
          .createNamespace(namespace)
          .then((n) => {
            onCreated(n);
            onClose();
          })
          .catch((e) => {
            setError((e as Error).message);
          });
      } else {
        setError("The namespace name must be at least 3 characters long");
      }
    }
  }, [docDriver, namespace, onCreated, onClose]);

  return (
    <Dialog
      open
      onOpenChange={(openState) => {
        if (!openState) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>Create Namespace</DialogTitle>

        <DialogDescription>
          A namespace is similar to a folder that groups your work together. It
          helps you organize and arrange your queries
        </DialogDescription>

        <Input
          placeholder="Please enter namespace"
          autoFocus
          value={namespace}
          onChange={(e) => setNamespace(e.currentTarget.value)}
        />

        {error && <div className="text-xs text-red-500 -mt-2">{error}</div>}

        <DialogFooter>
          <Button onClick={onCreateNamespace}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
