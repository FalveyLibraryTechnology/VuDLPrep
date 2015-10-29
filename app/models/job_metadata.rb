require 'json'

class JobMetadata
  def initialize(job)
    @job = job
    @filename = "#{job.dir}/job.json"
    if File.exist? @filename
      json = File.open(@filename) do |f|
        f.read
      end
      self.raw = JSON.parse(json)
    end
  end

  def raw
    {
      order: order.raw
    }
  end

  def raw=(data)
    @order = PageOrder.from_raw(data["order"])
  end

  def derivative_lockfile
    "#{@job.dir}/derivatives.lock"
  end

  def derivative_status
    status = { expected: 0, processed: 0, building: File.exist?(derivative_lockfile) }
    order.pages.each do |page|
      image = Image.new("#{@job.dir}/#{page.filename}")
      image.sizes.keys.each do |key|
        status[:expected] += 1
        if File.exist? image.derivative_path(key)
          status[:processed] += 1
        end
      end
    end
    status
  end

  def order
    @order ||= PageOrder.from_job(@job)
  end

  def save
    File.open(@filename, 'w') do |file|
      file.write raw.to_json
    end
  end
end