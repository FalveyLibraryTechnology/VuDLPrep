class Audio
    attr_accessor :extensions, :filename

    def initialize(filename, dir)
        @filename = filename
        @extensions = Array["OGG", "MP3"]
        @dir = dir
      end

      def constraint_for_extension(extension)
        if @extensions.has_key?(extension)
          @extensions[extension]
        else
          1
        end
      end

      def config
        @config ||= Rails.application.config_for(:vudl)
      end

      def derivative(extension)
        deriv = derivative_path(extension)
        if !File.exist?(deriv)
          path = File.dirname(deriv)
          FileUtils.mkdir_p path unless File.exist?(path)
          if @extensions.include? extension
            ffmpeg = config['ffmpeg_path']
            if (!ffmpeg)
              raise "ffmpeg not configured."
            end
            ffmpeg_cmd = "#{ffmpeg} -i #{@dir}/#{@filename} #{deriv}"
            ffmpeg_success = system ffmpeg_cmd
            if (!ffmpeg_success)
              raise "Problem running ffmpeg"
            end

          end
        end
        deriv
      end
    
      def derivative_path(extension = 'flac')
        filename = File.basename(@filename, '.*')
        "#{@dir}/#{filename}.#{extension.downcase}"
      end
end
