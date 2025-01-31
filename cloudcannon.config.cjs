const path = require("path");
const yaml = require("js-yaml");
const fs = require("fs");
const { matter } = require("md-front-matter");
const fg = require("fast-glob");

const common_content_structures = [];

const common_content_files = fg.sync([
  path.join(__dirname, "_common_content/**/*.mdx"),
]);

console.log(`Loading common content from ${common_content_files.join(", ")}`);

const ssg_data = yaml.load(
  fs.readFileSync(path.join(__dirname, "_data/ssgs.yml"), "utf8")
);
const guide_series_data = yaml.load(
  fs.readFileSync(path.join(__dirname, "_data/guide_series.yml"), "utf8")
);

for (const common_content_file of common_content_files) {
  const file_content = fs.readFileSync(common_content_file, {
    encoding: "utf8",
  });
  const { data } = matter(file_content);

  const structure_value = {
    label: data.content_name,
    preview: {
      text: [data.content_name],
    },
    value: {
      _file: common_content_file,
    },
    _inputs: {},
  };

  for (const [param, settings] of Object.entries(data.parameters)) {
    structure_value.value[param] = null;
    structure_value._inputs[param] = {
      type: settings.type,
      comment: settings.comment,
    };
  }

  common_content_structures.push(structure_value);
}

const snip = (name) =>
  path.join(__dirname, `.cloudcannon/snippets/${name}.json`);

const _snippets = {
  ...require(snip("code_block")),
  ...require(snip("conditional")),
  ...require(snip("data_reference")),
  ...require(snip("docs_image")),
  ...require(snip("multi_code_block")),
  ...require(snip("notice")),
  ...require(snip("tabs")),
  ...require(snip("youtube")),
  ...require(snip("common_content")),
  ...require(snip("starter_guide_deflector")),
  ...require(snip("common_content_param")),
  ...require(snip("system_version_default")),
  ...require(snip("system_version_list")),
  ...require(snip("slot")),
};

module.exports = {
  _snippets_imports: {
    mdx: true,
  },
  _snippets,
  _select_data: {
    docs_ssgs: ssg_data.ssgs,
    docs_guide_series: guide_series_data.series,
  },
  collections_config: {
    common_content: {
      paths: {
        dam_uploads:
          "[collection|slugify]/{date|year}/{date|month}/[asset-filename]",
      },
      path: "_common_content",
      output: false,
      icon: "copy_all",
      parser: "front-matter",
      schemas: {
        default: {
          path: ".cloudcannon/schemas/common_content.mdx",
        },
      },
      _inputs: {
        content_name: {
          comment:
            "Give this piece of reusable content a descriptive name, as this is what you will select when inserting it in a page",
        },
        parameters: {
          type: "object",
          comment: "Define any keys you created in Substitution snippets here",
          options: {
            subtype: "mutable",
            entries: {
              structures: {
                values: [
                  {
                    value: {
                      comment: null,
                      type: null,
                    },
                    _inputs: {
                      comment: {
                        comment:
                          "Text that will be shown alongside this parameter when using this piece of custom content",
                      },
                      type: {
                        comment:
                          "The CloudCannon input type that should be used for editing this parameter",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    articles: {
      path: "articles",
      output: true,
      icon: "article",
      url: "/articles/[slug]/",
      parser: "front-matter",
      schemas: {
        default: {
          path: ".cloudcannon/schemas/article.mdx",
        },
      },
    },
    guides: {
      path: "guides",
      output: true,
      icon: "school",
      url: "/guides/[relative_base_path]/[slug]/",
      parser: "front-matter",
      schemas: {
        default: {
          path: ".cloudcannon/schemas/guide-item.mdx",
        },
        guide_data: {
          path: ".cloudcannon/schemas/guide-data.yml",
          _inputs: {
            guide_target_ssgs: {
              type: "multiselect",
              options: {
                values: "_select_data.docs_ssgs",
                value_key: "name",
                preview: {
                  label: {
                    key: "name",
                  },
                },
              },
            },
            guide_series: {
              type: "select",
              options: {
                values: "_select_data.docs_guide_series",
                value_key: "id",
                preview: {
                  label: {
                    key: "name",
                  },
                },
              },
            },
          },
        },
      },
    },
    changelog: {
      path: "changelogs",
      output: true,
      icon: "tips_and_updates",
      url: (filePath) => {
        const regex =
          /^changelogs\/([0-9]{4})\-([0-9]{2})\-([0-9]{2})_(.+)\.mdx?/;
        const [, year, month, day, slug] = filePath.match(regex) || [];
        return `/changelog/${year}/${month}/${day}/${slug}.html`;
      },
      parser: "front-matter",
      sort: {
        key: "path",
        order: "desc",
      },
      create: {
        path: "{date|year}-{date|month}-{date|day}_{title|slugify}.[ext]",
        _inputs: {
          date: {
            instance_value: "NOW",
          },
        },
      },
      schemas: {
        default: {
          path: ".cloudcannon/schemas/changelog.mdx",
        },
      },
    },
    data: {
      path: "_data",
      filter: {
        base: "none",
        include: ["navigation.yml", "meta.yml", "headingnav.yml", "ssgs.yml"],
      },
    },
  },
  _editables: {
    content: {
      blockquote: true,
      bold: true,
      italic: true,
      strike: true,
      subscript: true,
      superscript: true,
      underline: true,
      link: true,
      bulletedlist: true,
      numberedlist: true,
      code: true,
      embed: true,
      horizontalrule: true,
      table: true,
      snippet: true,
    },
  },
  _structures: {
    related_links: {
      values: {
        value: {
          name: "",
          url: "",
        },
      },
    },
    common_content_types: {
      values: common_content_structures,
    },
  },
  _inputs: {
    _created_at: {
      instance_value: "NOW",
    },
    _uuid: {
      instance_value: "UUID",
    },
    explicit_canonical: {
      type: "url",
      comment:
        "Optionally reference a different page or URL that this page should set as its canonical URL",
    },
  },
  commit_templates: [{ template_string: "{message}" }],
  timezone: "Pacific/Auckland",
  base_url: "documentation",
};
