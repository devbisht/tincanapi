module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            files: ['src/**/*.js'],
            tasks: ['browserify:dist']
        },
        browserify: {
            dist: {
                src: 'src/main.js',
                dest: 'dist/tincansdk.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/tincansdk.js': ['dist/tincansdk.js']
                }
            },
            tracking: {
                files: {
                    'dist/tracking_code.js': ['tracking_code.js']
                }
            }
        },
        php: {
            dist: {
                options: {
                    port: 5000,
                    keepalive: true,
                    open: true,
                    base: './example'
                }
            }
        },
        copy: {
            dist: {
                files: [{
                    src: ['dist/tincansdk.js'],
                    dest: '../tincansdk.js'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-php');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['browserify:dist', 'uglify:dist', 'copy:dist']);
    grunt.registerTask('tracking_code', ['uglify:tracking']);
    grunt.registerTask('serve', ['php']);
    grunt.registerTask('dev', ['browserify:dist']);
};
