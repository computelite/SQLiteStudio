"use client";
import { Studio } from "@/components/gui/studio";
import {
  Toolbar
} from "@/components/gui/toolbar";
import { StudioExtensionManager } from "@/core/extension-manager";
import { createSQLiteExtensions } from "@/core/standard-extension";
import SqljsDriver from "@/drivers/sqljs-driver";
import {
  LucideFile
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SqlJsStatic } from "sql.js";


// const SQLITE_FILE_EXTENSIONS =
//   ".db,.sdb,.sqlite,.db3,.s3db,.sqlite3,.sl3,.db2,.s2db,.sqlite2,.sl2";


async function loadDatabaseFromOPFS(modelName: string) {
  const root = await navigator.storage.getDirectory();
  try {
    const dataFolder = await root.getDirectoryHandle('data', { create: true });
    const projectFolder = await dataFolder.getDirectoryHandle('Default', { create: true });
    const fileHandle = await projectFolder.getFileHandle(modelName, { create: false });
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    console.log("Existing database found, loading it.", buffer);
    return buffer;
  } catch (e) {
    console.log("No existing database found, creating a new one.");
    return null;
  }
}
const params = new URLSearchParams(window.location.search)
const p_ModelName = params.get('modelName');

interface ModelData {
  model_name: string;
  project_name: string;
}

interface ProjectStructure {
  [projectName: string]: {
    Models: {
      [modelName: string]: {
        templateName: string;
        status: string;
      };
    };
    status: string;
  };
}

interface ModelInfo {
  templateName: string;
  status: string;
}

interface Project {
  Models: {
    [modelName: string]: ModelInfo;
  };
  status: string;
}



type Projects = Record<string, Project>;

async function getUserModels(): Promise<string[][]> {
  const Projects: string | null = localStorage.getItem("Projects");
  const all_models: string[][] = [];

  if (Projects) {
    const all_projects: Projects = JSON.parse(Projects);

    for (const prj_name in all_projects) {
      if (all_projects[prj_name].status === "Active") {
        for (const model_name in all_projects[prj_name].Models) {
          if (all_projects[prj_name].Models[model_name].status === "Active") {
            all_models.push([
              model_name,
              all_projects[prj_name].Models[model_name].templateName,
              prj_name,
              "SQLITE",
            ]);
          }
        }
      }
    }
  }

  return all_models;
}

export default function PlaygroundEditorBody() {
  const [sqlInit, setSqlInit] = useState<SqlJsStatic>();
  const searchParams = useSearchParams();

  const [driver, setDriver] = useState<SqljsDriver>();

  const [fileName, setFilename] = useState("");
  const [modelName, setModelName] = useState<string | null>(p_ModelName);

  /**
   * Initialize the SQL.js library.
   */
  const onReady = useCallback(() => {
    window
      .initSqlJs({
        locateFile: (file) => `/sqljs/${file}`,
      })
      .then(setSqlInit);
  }, []);

  const addNewModel = useCallback(async function (data: ModelData): Promise<{ msg: string }> {
    const modelName: string = data.model_name;
    const projectName: string = data.project_name;

    if (!localStorage.getItem("Projects")) {
      localStorage.setItem("Projects", JSON.stringify({}));
    }
    const opfsDir = await navigator.storage.getDirectory();
    const dataFolder = await opfsDir.getDirectoryHandle("data", { create: true });
    const projectFolder = await dataFolder.getDirectoryHandle(projectName, {
      create: true,
    });
    await projectFolder.getFileHandle(`${modelName}.sqlite3`, { create: true });
    const Projects: string | null = localStorage.getItem("Projects");
    const all_projects: ProjectStructure = Projects ? JSON.parse(Projects) : {};

    if (Object.keys(all_projects).includes(projectName)) {
      if (!(modelName in all_projects[projectName].Models)) {
        all_projects[projectName].Models[modelName] = { templateName: 'Sample DB', status: 'Active' };
      } else {
        return { msg: 'Model already exists with the same name' };
      }
    } else {
      all_projects[projectName] = {
        Models: { [modelName]: { templateName: 'Sample DB', status: 'Active' } },
        status: 'Active'
      };
    }

    localStorage.setItem('Projects', JSON.stringify(all_projects));

    let msg: string = "Success";

    try {
      const response = await fetch(
        `/sample_db.sql`
      );

      if (!response.ok) {
        msg = `Failed to load SQL script: ${response.statusText}`;
      }

      const sqlScript: string = await response.text(); // Retrieve the text content of the SQL script
      try {
        if (driver) {
          await driver.executeScript(sqlScript);
        }

      } catch (error) {
        console.error("Error executing SQL script:", error);
        msg = String(error);
      }
    } catch (error) {
      console.error(error);
      msg = "Error fetching SQL script";
    }

    return { msg };
  }, [driver])


  /**
   * Trying to initial the database from preloadDatabase or session id.
   * If no database source provided, we will create a new empty database.
   */
  useEffect(() => {
    if (!sqlInit) return;

    const initializeModel = async () => {
      let bufferDB: ArrayBuffer | null = null;

      let dModelName = 'Default_DB'
      if (modelName) {
        dModelName = modelName
      }
      try {
        bufferDB = await loadDatabaseFromOPFS(`${dModelName}.sqlite3`);
      } catch (error) {
        console.error("Error loading database:", error);
      }

      const name = `${dModelName}.sqlite3`;
      if (bufferDB) {
        setFilename(name);

        const sqljsDatabase = new sqlInit.Database(new Uint8Array(bufferDB));
        setDriver(new SqljsDriver(sqljsDatabase, name));

      } else {
        console.log("No database provided");
        // If no database is provided, create a new Default_DB database.
        if (!modelName) {

          const all_models = await getUserModels();
          const defaultDbExists: boolean = all_models.some(
            (subArr: string[]) => subArr[0] === dModelName
          );

          if (!defaultDbExists) {
            setFilename(name);
            const sqljsDatabase = new sqlInit.Database();
            setDriver(new SqljsDriver(sqljsDatabase, name));
          }
        }
      }
    };

    initializeModel();
  }, [sqlInit, searchParams, modelName]);

  /**
   * Ask for confirmation before closing the tab if there are changes.
   */
  useEffect(() => {

    if (driver) {
      const addDefaultModel = async () => {
        console.log('add new model hits')
        let bufferDB: ArrayBuffer | null = null;
        const model_name = 'Default_DB'
        setModelName(model_name)
        const data = {
          model_name: model_name,
          model_template: "Sample DB",
          project_name: "Default",
          db_user: "",
          password: "",
          host: "",
          port: 0,
          db_type: "SQLITE",
        };

        const res = await addNewModel(data);

        if (res && res.msg == "Success") {
          if (!sqlInit) return;
          try {
            bufferDB = await loadDatabaseFromOPFS(`${model_name}.sqlite3`);
          } catch (error) {
            console.error("Error loading database:", error);
          }

          if (bufferDB) {
            const sqljsDatabase = new sqlInit.Database(new Uint8Array(bufferDB));
            // setDriver(new SqljsDriver(sqljsDatabase, name));
            driver.reload(sqljsDatabase)
          }
        }
      }

      if (!modelName) {
        addDefaultModel();
      }

      const onBeforeClose = (e: Event) => {
        if (driver.hasChanged()) {
          e.preventDefault();
          return "Are you sure you want to close without change?";
        }
      };

      window.addEventListener("beforeunload", onBeforeClose);
      return () => window.removeEventListener("beforeunload", onBeforeClose);
    }
  }, [driver, addNewModel, sqlInit, modelName]);

  const extensions = useMemo(() => {
    return new StudioExtensionManager(createSQLiteExtensions());
  }, []);

  const dom = useMemo(() => {

    if (driver) {
      return (
        <Studio
          extensions={extensions}
          color="gray"
          name="Playground"
          driver={driver}
          containerClassName="w-full h-full"
        />
      );
    }

    return <div></div>;
  }, [driver, extensions]);

  return (
    <>
      <Script src="/sqljs/sql-wasm.js" onReady={onReady} />
      {/* <ScreenDropZone onFileDrop={onFileDrop} /> */}
      <div className="flex h-screen w-screen flex-col">
        <div className="border-b p-1">
          <Toolbar>
            {fileName && (
              <div className="flex items-center gap-1 rounded bg-yellow-300 p-2 text-xs text-black">
                <LucideFile className="h-4 w-4" />
                <span>
                  Editing <strong>{fileName}</strong>
                </span>
              </div>
            )}

          </Toolbar>
        </div>
        <div className="flex-1 overflow-hidden">{dom}</div>
      </div>
    </>
  );
}

/**
 * Returns the file handler from the session id if it exists. Otherwise, it will return undefined.
 *
 * @param sessionId
 * @returns
 */
