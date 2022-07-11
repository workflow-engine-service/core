import { Express } from 'express';
import { Const } from '../const';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
export namespace Wiki {

    export async function init(app: Express) {
        app.get(`${Const.CONFIGS.server.wiki_base_url}/api/menu`, async (req, res) => {
            let docsPath = path.join(__dirname, '..', 'docs');
            if (!fs.existsSync(docsPath)) {
                docsPath = path.join(__dirname, '..', '..', 'docs');
            }
            let entries = fs.readdirSync(docsPath, { withFileTypes: true });
            return res.status(200).json(entries.filter(i => i.isFile() && i.name.endsWith('.md')).map(i => i.name));
        });

        app.post(`${Const.CONFIGS.server.wiki_base_url}/api/document`, async (req, res) => {
            let docsPath = path.join(__dirname, '..', 'docs');
            if (!fs.existsSync(docsPath)) {
                docsPath = path.join(__dirname, '..', '..', 'docs');
            }
            // =>load document
            let pagePath = path.join(docsPath, req.body['page']);
            let document = fs.readFileSync(pagePath).toString();
            let doc = marked.parse(document);

            return res.status(200).json({ document: doc, last_update: fs.statSync(pagePath).mtime.toDateString() });


        });
    }
}