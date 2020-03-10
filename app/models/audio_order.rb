class AudioOrder
    attr_reader :list
  
    def self.from_job(job)
      list = Dir.glob("#{job.dir}/*.flac", File::FNM_CASEFOLD).sort.map do |flac|
        Audio.new(File.basename(flac), job.dir)
      end
      self.new list
    end
  
    def self.from_raw(raw)
        list = raw.map do |audio|
        Audio.from_raw audio
      end
      self.new list
    end
  
    def initialize(list)
      @list = list
    end
  
    def raw
      @list.map do |audio|
        audio.raw
      end
    end
end