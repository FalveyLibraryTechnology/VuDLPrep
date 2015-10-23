class JobMetadataValidator
  def self.valid?(job, params)
    if !params[:order].is_a? Enumerable
      return false
    end
    self.order_valid?(job, params[:order])
  end

  def self.order_valid?(job, order)
    old = job.metadata.order.raw.map { |entry| entry[:filename]}
    new = order.map { |entry| entry[:filename] }
    diff = old - new
    (diff.empty? && old.length == new.length)
  end
end