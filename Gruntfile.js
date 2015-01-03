module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: ['build'],

    concat: {
      options: {
        separator: ";"
      },
      dist: {
        src: [
          "src/js/editor.js",
          "src/js/editor.options.js",
          "src/js/editor.text.js",
          "src/js/editor.image.js"
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },

    cssmin: {
      dist: {
        options: {
          banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
        },
        files: [{
          "build/editor.min.css": "build/editor.css"
        }]
      }
    },

    jshint: {
      all: ['src/js/*.js', 'test/**/*.js'],
      gruntfile: ['Gruntfile.js']
    },

    sass: {
      dist: {
        files: {
          "build/editor.css": "src/scss/editor.scss"
        }
      }
    },

    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
      },
      build: {
        src: "build/<%= pkg.name %>.js",
        dest: "build/<%= pkg.name %>.min.js"
      }
    },

    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile']
      },
      scripts: {
        files: ["src/**/*.js"],
        tasks: ["build-js"]
      },
      css: {
        files: ["src/**/*.scss"],
        tasks: ["build-css"]
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask("build-js", ["jshint:all", "concat", "uglify"]);
  grunt.registerTask("build-css", ["sass", "cssmin"]);
  grunt.registerTask("build", ["build-js", "build-css"]);
  grunt.registerTask('default', ["clean", "build"]);
  grunt.registerTask('dev', ["default", "watch"]);

};