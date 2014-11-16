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
          "src/js/editor.*.js"
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'src/js/*.js', 'test/**/*.js']
    },

    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
      },
      build: {
        src: "build/<%= pkg.name %>.js",
        dest: "build/<%= pkg.name %>.min.js"
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask("build", ["jshint", "concat", "uglify"]);
  grunt.registerTask('default', ["clean", "build"]);

};