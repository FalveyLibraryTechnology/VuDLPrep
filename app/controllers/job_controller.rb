class JobController < ApplicationController
  def index
    data = []
    Dir.glob("#{holdingPath}/*").each do |dir|
      if Dir.exist?(dir)
        current = { category: File.basename(dir), jobs: jobs(dir).map { |job| File.basename(job) } }
        data.push(current)
      end
    end
    render json: data
  end

  def jobs(dir)
    Dir.glob("#{dir}/*").keep_if do |job|
      Dir.exist?(job)
    end
  end
end
